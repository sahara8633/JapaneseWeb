// Google 로그인 + Firestore로 기록을 계정에 저장해요.
// firebase-config.js가 비어 있으면 아무것도 불러오지 않고 로그인 버튼도 숨겨 둬요.
import config from './firebase-config.js';

const V = '13.4.0';
const $ = id => document.getElementById(id);
const S = window.kanaSync;

if (S && config && config.apiKey && config.projectId) start().catch(e => {
  console.error(e);
  S.status('로그인 기능을 불러오지 못했어요. 기록은 이 브라우저에 저장돼요.');
});

async function start() {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-auth.js`),
    import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`),
  ]);
  const app = initializeApp(config);
  const auth = A.getAuth(app);
  const db = F.getFirestore(app);
  const provider = new A.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  $('acct').hidden = false;
  A.getRedirectResult(auth).catch(() => {});

  $('loginBtn').addEventListener('click', async () => {
    try { await A.signInWithPopup(auth, provider); }
    catch (e) {
      if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
        await A.signInWithRedirect(auth, provider);
      } else if (e && e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        console.error(e);
        S.status('로그인하지 못했어요. 잠시 뒤에 다시 해 주세요.');
      }
    }
  });
  // 로그아웃은 한 번 더 물어봐요.
  const dlg = $('logoutDlg');
  $('logoutBtn').addEventListener('click', () => {
    if (dlg && dlg.showModal) dlg.showModal();
    else if (confirm('정말 로그아웃할까요?')) A.signOut(auth);
  });
  if (dlg) {
    dlg.addEventListener('close', () => { if (dlg.returnValue === 'ok') A.signOut(auth); dlg.returnValue = ''; });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close('cancel'); });
  }

  A.onAuthStateChanged(auth, async user => {
    $('loginBtn').hidden = !!user;
    $('me').hidden = !user;
    if (!user) {
      S.detach();
      if (S.admin) S.admin(null);
      S.status('로그인하면 다른 브라우저나 기기에서도 기록이 이어져요. 지금은 이 브라우저에만 저장돼요.');
      return;
    }
    const name = user.displayName || user.email || '내 계정';
    $('meName').textContent = name;
    $('me').title = user.email || '';
    const ava = $('meAva');
    if (user.photoURL) { ava.style.backgroundImage = `url("${user.photoURL}")`; ava.textContent = ''; }
    else { ava.style.backgroundImage = ''; ava.textContent = [...name][0]; }

    S.status('계정에서 기록을 불러오는 중이에요…');
    const ref = F.doc(db, 'users', user.uid);
    // 저장할 때마다 계정 쪽 기록을 먼저 합쳐서, 다른 기기에서 푼 기록이 덮어써지지 않게 해요.
    const sync = async () => {
      const snap = await F.getDoc(ref);
      const merged = S.mergeIn(snap.exists() ? snap.data() : {});
      // 이메일과 이름은 관리자가 이메일로 기록을 찾을 때 써요
      await F.setDoc(ref, { days: merged.days, miss: merged.miss, wmiss: merged.wmiss, known: merged.known, resets: merged.resets,
        email: (user.email || '').toLowerCase(), name: user.displayName || '', updated: Date.now() });
    };
    try {
      await sync();
      S.attach({ set: () => sync() });
      S.status('기록이 내 Google 계정에 저장돼요. 다른 브라우저나 기기에서도 로그인하면 이어서 볼 수 있어요. 학습 기록(이메일 포함)은 이 사이트 관리자도 볼 수 있어요.');
    } catch (e) {
      console.error(e);
      S.status('계정에 기록을 저장하지 못했어요. 지금은 이 브라우저에만 저장돼요.');
    }
    // 관리자: Firestore admins/{내 uid} 문서가 있으면 관리 탭을 켜요. 실제로 남의 기록을 읽을 수 있는지는 보안 규칙이 정해요.
    try {
      const me = await F.getDoc(F.doc(db, 'admins', user.uid));
      if (me.exists() && S.admin) S.admin({
        // 이메일로 한 명 찾기
        find: async email => {
          const q = F.query(F.collection(db, 'users'), F.where('email', '==', email.trim().toLowerCase()), F.limit(1));
          const res = await F.getDocs(q);
          return res.empty ? null : { id: res.docs[0].id, ...res.docs[0].data() };
        },
        // 전체 사용자 목록 (관리자만 읽을 수 있어요)
        list: async () => (await F.getDocs(F.collection(db, 'users'))).docs.map(d => ({ id: d.id, ...d.data() })),
      });
    } catch (e) { /* 관리자가 아니거나 규칙이 아직 없으면 조용히 넘어가요 */ }
  });
}
