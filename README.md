# JapaneseWeb

히라가나를 매일 연습하는 퀴즈 웹페이지예요.

- 히라가나 / 가타카나 / 섞어서 중 골라서 출제
- 답하는 방법: 보기 4개 중 고르기, 또는 읽는 법을 한글로 직접 쓰기
- 문제 수: 10, 20, 30, 전체(고른 범위의 글자 수) 또는 직접 입력
- 범위: 기본 46자, 탁점·반탁점, 작은 ゃゅょ
- 틀린 글자만 다시 풀기, 연속 일수
- '기록' 탭: 이번 주 기록, 자주 틀린 글자, 기록 옮기기
- 테마: 라이트 / 다크 / 라이트다크(위쪽만 어둡게). 처음엔 기기 설정을 따라가요
- 기록은 브라우저(localStorage)에 저장되고, Google로 로그인하면 계정에도 저장돼서 다른 브라우저나 기기에서 이어서 볼 수 있어요. 로그인 없이 '기록 옮기기'로 옮길 수도 있어요.

## 실행

빌드가 필요 없는 정적 페이지예요. `index.html`을 브라우저로 열면 바로 돼요.
(로그인 기능은 파일로 열면 동작하지 않아요. GitHub Pages 같은 웹 주소로 열어야 해요.)

## 파일 구성

- `index.html`: 페이지 구조(HTML)
- `style.css`: 스타일
- `script.js`: 퀴즈 동작, 기록 저장, 테마
- `sync.js`: Google 로그인과 계정 기록 동기화 (Firebase)
- `firebase-config.js`: Firebase 웹 앱 설정값

## 호스팅

폴더의 파일을 모두 같은 위치에 올리면 돼요. 정적 사이트를 받는 곳이면 어디든 쓸 수 있어요.

- **GitHub Pages**: 저장소 Settings → Pages → Branch를 `main` / `(root)`로 설정
  (비공개 저장소에서 Pages를 쓰려면 유료 플랜이 필요해요. 무료로 쓰려면 저장소를 공개로 바꾸세요.)
- **Netlify / Vercel / Cloudflare Pages**: 이 저장소를 연결하고, 빌드 명령은 비워 두고, 배포 폴더는 `/`(루트)로 설정

폰트는 Google Fonts(Noto Sans JP, Noto Sans KR)에서 불러와요. 인터넷이 안 되면 컴퓨터에 설치된 일본어 기본 폰트로 표시돼요.

## 로그인 설정 (Firebase, 무료)

`firebase-config.js`가 비어 있으면 로그인 버튼이 숨겨지고, 기록은 브라우저에만 저장돼요. 로그인을 켜려면 한 번만 아래처럼 설정하세요.

1. https://console.firebase.google.com 에서 **프로젝트 추가** (Google 애널리틱스는 꺼도 돼요)
2. **Authentication** → 시작하기 → 로그인 방법에서 **Google** 사용 설정
3. **Authentication** → 설정 → **승인된 도메인**에 `sahara8633.github.io` 추가
4. **Firestore Database** → 데이터베이스 만들기 (프로덕션 모드, 위치는 `asia-northeast3` 서울 추천)
5. Firestore → **규칙** 탭에 아래 규칙을 붙여 넣고 게시

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

6. 프로젝트 설정(톱니바퀴) → 일반 → 내 앱에서 **웹 앱(</>) 추가** → 나오는 `firebaseConfig`의 `apiKey`, `authDomain`, `projectId`, `appId`를 `firebase-config.js`에 붙여 넣기

`apiKey` 같은 웹 설정값은 공개돼도 괜찮아요. 각자 자기 기록만 읽고 쓸 수 있게 막는 건 5번의 보안 규칙이에요.
