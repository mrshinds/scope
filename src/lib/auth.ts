import { sendTemplateEmail } from "./email";

// 임시 사용자 저장소 (실제 구현에서는 데이터베이스 사용)
const users = new Map<string, { 
  email: string; 
  passwordHash: string; 
  role: 'user' | 'admin' | 'superadmin';
}>();

// 인증 코드 저장소 (실제 구현에서는 데이터베이스 사용)
const verificationCodes = new Map<string, {
  code: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}>();

/**
 * 8자리 인증 코드 생성
 */
export function generateVerificationCode(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

/**
 * 이메일에 인증 코드 전송
 */
export async function sendVerificationCode(email: string): Promise<boolean> {
  // 신한은행 이메일 검증
  if (!email.endsWith('@shinhan.com')) {
    return false;
  }

  const code = generateVerificationCode();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10분 후 만료

  verificationCodes.set(email, {
    code,
    createdAt: now,
    expiresAt,
    used: false
  });

  try {
    // 이메일 발송 (실제로는 보내지 않음)
    await sendTemplateEmail(
      'verification',
      { code, expiresAt },
      { 
        to: email,
        subject: '[SCOPE] 인증 코드 안내'
      }
    );
    
    // 개발 모드에서 인증 코드를 콘솔에 출력하고 localStorage에 저장
    console.log(`[개발 모드] 인증 코드: ${code}`);
    
    // 클라이언트 환경일 때만 localStorage 사용
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('lastVerificationCode', code);
    }
    
    // alert 창으로 인증 코드 표시 (개발 모드에서만)
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
      alert(`개발 모드 알림: 인증 코드는 ${code} 입니다.`);
    }
    
    return true;
  } catch (error) {
    console.error('인증 코드 이메일 발송 실패:', error);
    return false;
  }
}

/**
 * 인증 코드 검증
 */
export function verifyCode(email: string, code: string): boolean {
  const verification = verificationCodes.get(email);
  
  if (!verification) {
    return false;
  }
  
  const now = new Date();
  
  // 만료 여부 및 코드 일치 여부 확인
  if (now > verification.expiresAt || verification.used || verification.code !== code) {
    return false;
  }
  
  // 사용됨으로 표시
  verificationCodes.set(email, {
    ...verification,
    used: true
  });
  
  return true;
}

/**
 * 비밀번호 설정 (간단한 해싱 예시, 실제로는 bcrypt 등 사용)
 */
export function setPassword(email: string, password: string): boolean {
  if (!verificationCodes.get(email)?.used) {
    return false;
  }
  
  // 간단한 해싱 (실제로는 bcrypt 등 사용해야 함)
  const passwordHash = `hashed_${password}`;
  
  // 사용자 생성
  users.set(email, {
    email,
    passwordHash,
    role: email.includes('admin') ? 'admin' : 'user', // 간단한 예시
  });
  
  return true;
}

/**
 * 로그인 검증
 */
export function verifyLogin(email: string, password: string): { 
  success: boolean; 
  role?: 'user' | 'admin' | 'superadmin' 
} {
  const user = users.get(email);
  
  if (!user) {
    return { success: false };
  }
  
  // 비밀번호 검증 (실제로는 bcrypt.compare 등 사용)
  const passwordHash = `hashed_${password}`;
  if (user.passwordHash !== passwordHash) {
    return { success: false };
  }
  
  return { 
    success: true,
    role: user.role
  };
} 