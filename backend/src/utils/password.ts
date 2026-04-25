export class PasswordUtils {
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static calculatePasswordStrength(password: string): {
    score: number;
    strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  } {
    let score = 0;

    // Length bonus
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)) score += 1;

    // Complexity bonus
    if (password.length >= 16 && score >= 4) score += 1;

    const strengthMap = {
      0: 'very-weak',
      1: 'very-weak',
      2: 'weak',
      3: 'fair',
      4: 'good',
      5: 'strong',
      6: 'strong',
      7: 'strong',
    } as const;

    return {
      score,
      strength: strengthMap[Math.min(score, 7) as keyof typeof strengthMap],
    };
  }
}