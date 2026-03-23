/**
 * 环境变量校验
 *
 * 在服务器启动时调用，确保所有必需的环境变量已正确配置。
 * 缺失时 throw 带清晰说明的错误，避免运行时出现难以排查的问题。
 */

interface EnvVarConfig {
  /** 环境变量名 */
  name: string;
  /** 说明（缺失时展示） */
  description: string;
  /** 是否必需，默认 true */
  required?: boolean;
}

const REQUIRED_ENV_VARS: EnvVarConfig[] = [
  {
    name: 'MONGODB_URI',
    description: 'MongoDB 连接字符串，例如 mongodb://localhost:27017/hotornot',
  },
  {
    name: 'TIKHUB_API_KEY',
    description: 'TikHub API 密钥，用于小红书/抖音数据获取。在 https://tikhub.io 申请',
  },
  {
    name: 'GEMINI_API_KEY',
    description: 'Google Gemini API 密钥，用于 AI 内容分析',
  },
  {
    name: 'JWT_SECRET',
    description: 'JWT 签名密钥，用于用户认证。建议使用 openssl rand -base64 32 生成',
  },
];

const OPTIONAL_ENV_VARS: EnvVarConfig[] = [
  {
    name: 'IP_HASH_SALT',
    description: 'IP 地址哈希盐值，用于用户隐私保护',
    required: false,
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API 密钥（可选 AI 服务）',
    required: false,
  },
];

/**
 * 检查环境变量是否为占位符值
 */
function isPlaceholder(value: string): boolean {
  const placeholders = [
    'your_',
    'xxx',
    'change_me',
    'placeholder',
    'CHANGE_ME',
    'YOUR_',
  ];
  return placeholders.some((p) => value.includes(p));
}

/**
 * 校验所有必需环境变量是否已配置。
 * 缺失或为占位符时抛出包含详细说明的错误。
 */
export function validateEnv(): void {
  const missing: string[] = [];
  const placeholder: string[] = [];

  for (const { name, description } of REQUIRED_ENV_VARS) {
    const value = process.env[name];
    if (!value || value.trim() === '') {
      missing.push(`  ❌ ${name} — ${description}`);
    } else if (isPlaceholder(value)) {
      placeholder.push(`  ⚠️  ${name} — 当前值看起来是占位符，请填入真实值。${description}`);
    }
  }

  // 可选变量仅警告
  for (const { name, description } of OPTIONAL_ENV_VARS) {
    const value = process.env[name];
    if (!value || isPlaceholder(value)) {
      console.warn(`⚠️  可选环境变量未配置: ${name} — ${description}`);
    }
  }

  if (missing.length > 0 || placeholder.length > 0) {
    const lines = [
      '',
      '🚨 环境变量校验失败！',
      '',
      '请在 apps/web/.env.local 中配置以下变量（参考 .env.example）:',
      '',
    ];

    if (missing.length > 0) {
      lines.push('缺失的必需变量:');
      lines.push(...missing);
      lines.push('');
    }

    if (placeholder.length > 0) {
      lines.push('仍为占位符的变量:');
      lines.push(...placeholder);
      lines.push('');
    }

    lines.push('详见 ENV_CONFIG_GUIDE.md');
    lines.push('');

    throw new Error(lines.join('\n'));
  }

  console.log('✅ 环境变量校验通过');
}
