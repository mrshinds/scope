# SCOPE (Shinhan Consumer Protection Eye)

신한은행 소비자보호부 내부 직원용 이슈 감지 플랫폼 'SCOPE'의 프로토타입입니다.

## 개요

SCOPE는 신한은행 소비자보호부 직원들이 금융 소비자 보호 관련 이슈를 효율적으로 모니터링하고 관리할 수 있도록 설계된 웹 애플리케이션입니다. 다양한 소스에서 수집된 데이터를 통합하여 이슈를 감지하고, 이를 직원들이 쉽게 확인하고 스크랩할 수 있는 기능을 제공합니다.

## 주요 기능

- **이메일 인증 기반 로그인**: 신한은행 웹메일 주소(@shinhan.com)를 통한 8자리 인증코드 발송 및 인증
- **대시보드**: 오늘 수집된 요약 이슈 확인
- **보도자료 관리**: 기관/언론사별 보도자료 목록 확인 및 스크랩
- **스크랩 아카이브**: 중요 자료 스크랩 및 메모 기능
- **관리자 대시보드**: 이슈 수, 태그 트렌드, 사용자 활동 로그 등 확인

## 기술 스택

- **프론트엔드**: Next.js (App Router), React, TypeScript
- **스타일링**: TailwindCSS, Shadcn UI
- **배포**: Vercel

## 로컬 개발 환경 설정

1. 저장소 클론
```bash
git clone https://github.com/username/scope.git
cd scope
```

2. 의존성 설치
```bash
npm install
```

3. 개발 서버 실행
```bash
npm run dev
```

4. 브라우저에서 `http://localhost:3000`으로 접속하여 애플리케이션 확인

## 프로젝트 구조

```
scope/
├── src/
│   ├── app/                # 페이지 및 라우팅
│   │   ├── login/          # 로그인 화면
│   │   ├── verify/         # 인증 코드 확인 화면
│   │   ├── set-password/   # 비밀번호 설정 화면
│   │   ├── dashboard/      # 메인 대시보드
│   │   ├── sources/        # 보도자료 목록
│   │   ├── archive/        # 스크랩 자료
│   │   └── admin/dashboard/# 관리자 대시보드
│   ├── components/         # 재사용 가능한 컴포넌트
│   │   ├── forms/          # 폼 관련 컴포넌트
│   │   ├── layout/         # 레이아웃 컴포넌트
│   │   └── ui/             # UI 컴포넌트
│   └── lib/                # 유틸리티 및 공통 함수
│       ├── utils.ts        # 유틸리티 함수
│       ├── email.ts        # 이메일 전송 모듈
│       ├── types.ts        # 타입 정의
│       └── auth.ts         # 인증 관련 유틸리티
├── public/                 # 정적 파일
└── ...                     # 구성 파일
```

## 라이선스

이 프로젝트는 내부용으로 신한은행의 소유입니다. 