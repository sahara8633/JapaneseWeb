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
      await F.setDoc(ref, { days: merged.days, miss: merged.miss, wmiss: merged.wmiss, known: merged.known, updated: Date.now() });
    };
    try {
      await sync();
      S.attach({ set: () => sync() });
      S.status('기록이 내 Google 계정에 저장돼요. 다른 브라우저나 기기에서도 로그인하면 이어서 볼 수 있어요.');
    } catch (e) {
      console.error(e);
      S.status('계정에 기록을 저장하지 못했어요. 지금은 이 브라우저에만 저장돼요.');
    }
  });
}
