# 정적 배포와 도메인

[English](DEPLOYMENT.md) · **한국어**

## GitHub Pages / 권장

압축을 풀고 Loopfield-Studio 폴더의 내용물을 저장소 루트에 올린다. 최상위에 index.html, js/, css/, assets/가 있어야 한다. 프로젝트 폴더가 한 번 더 중첩되지 않도록 확인한다.

Settings → Pages → Build and deployment → Source를 GitHub Actions로 선택한다. 포함된 `.github/workflows/pages.yml`은 main push 또는 수동 실행으로 정적 파일을 배포한다. 처음 Source를 변경했다면 Actions 탭에서 Deploy Loopfield Studio를 수동 실행한다. main이 아닌 기본 브랜치를 쓰면 워크플로 branches 항목을 바꾼다. 조직 저장소에서는 Pages 배포 권한이나 승인이 필요할 수 있다.

빌드·서버·DB·npm 의존성 설치는 없다. 워크플로는 Node 단위 테스트 후 앱, 현재 문서, 예제와 기기 출력 검사 페이지를 정적 배포 파일로 묶는다. 루트 `.nojekyll`과 `CNAME`을 포함하고, 유지보수 지침·자동 검사 스크립트·생성된 보고서는 제외한다. 배포 URL의 /저장소명/ 아래에서 동작하도록 정적 경로는 상대 경로이다.

## 브랜치 방식 대안

GitHub Actions 워크플로를 비활성화하거나 pages.yml을 제거한 뒤, Settings → Pages → Deploy from a branch → main / (root)를 선택할 수도 있다. 두 배포 방법을 동시에 운영하지 않는다. 내용물은 동일한 정적 파일이다.

## 사용자 도메인

운영 도메인은 `loopfield.studio`이다. 루트의 `CNAME` 파일에는 이 호스트명만 기록한다. **main / (root)** 브랜치 방식으로 배포할 때 이 파일을 유지해야 한다. 파일이 빠지면 DNS와 앱 배포가 정상이어도 도메인 연결이 해제될 수 있으며, 회귀검사로 파일 누락을 방지한다.

모든 업데이트는 저장소의 `AGENTS.md` 도메인 보존 규칙을 따르고, 커밋 전에 `node --test tests/*.test.mjs`를 실행한다. 사용자 워크플로는 배포 전에 이 회귀검사를 실행하고 정적 배포 파일에도 `CNAME`을 명시적으로 복사하므로, 파일이 없으면 패키징이 중단된다. 브랜치 배포는 이 사용자 워크플로의 성공을 선행 조건으로 삼지 않으므로, 로컬 검사와 루트 파일 보존을 반드시 지킨다.

**Settings → Pages → Custom domain**에 `loopfield.studio`를 설정한다. 루트 도메인과 서브도메인의 DNS는 GitHub 공식 가이드에 맞추고, 인증서가 준비되면 **Enforce HTTPS**를 켠다. Source가 **GitHub Actions**이면 도메인 매핑에 CNAME 파일을 사용하지 않으므로 저장소의 Custom domain 설정이 반드시 필요하다. 브랜치 배포와 사용자 워크플로를 동시에 운영하지 않고 한 가지 방식을 선택한다. DNS 전파와 인증서 발급은 앱 코드가 처리하는 부분이 아니다.

로컬이나 원격 이력을 바꾸기 전 원격에서 만든 도메인 설정 커밋을 반영한다. 명시적인 승인 없이 이를 강제 푸시로 덮어쓰지 않는다.

브라우저 저장소는 origin별이므로 기존 github.io 주소에서 새 도메인으로 이전하면 자동 저장 작업이 따라오지 않는다. 이전 주소에서 JSON을 저장하고 새 도메인에서 가져온다.

## localhost

```sh
python -m http.server 8000
```

`http://localhost:8000`에서 연다. file:// 더블클릭은 ES module과 인코더 보안 조건 때문에 지원 대상이 아니다. `http://192.168.x.x`처럼 다른 장치 IP로 열린 평문 HTTP는 localhost 예외가 아니다. 휴대폰 원격 확인은 HTTPS 정적 배포로 한다.

## 공개 전 점검

`tests/browser.html`에서 그래픽 검사를 실행한 뒤 1080p부터 실제 네이티브 MP4 생성·디코딩을 확인한다. QHD·DCI 2K·UHD도 목표 기기에서 각각 확인한다. Studio에서 파일 직접 저장·취소·JSON 보관·복원을 별도로 확인한다. 60fps와 60초는 짧은 30fps 시험과 별개로 확인한다.

개인 사용용 정적 서비스와 로그인·결제·공개 갤러리 서비스를 구분한다. 현재 코드에는 회원 기능이나 콘텐츠 서버가 없으며 GitHub Pages가 영상 렌더 서버 역할을 하는 것도 아니다. 각 방문자의 장치 자원을 사용한다.

공식 참조: [GitHub Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages).

## 공유 미리보기 이미지

사이트 OG/Twitter 메타데이터는 `assets/presets/og-site.png`의 절대 URL을 사용합니다. 도메인이나 저장소 이름을 바꾸면 canonical 및 이미지 URL도 함께 갱신하세요. 저장소용 `assets/presets/og-repository.png`는 GitHub의 Settings → General → Social preview에서 직접 등록합니다. 파일을 커밋하는 것만으로 저장소 설정이 바뀌지는 않습니다.

두 이미지는 사용자가 제공한 줄리아 집합을 참고해 생성한 홍보용 이미지이며, 셰이더의 실제 출력 캡처는 아닙니다.
