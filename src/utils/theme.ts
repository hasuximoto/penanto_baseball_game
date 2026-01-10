// デザインテーマ定義
export const COLORS = {
  // メインカラー
  background: '#121212', // 深みのある黒
  card: '#1E1E1E', // 浮かび上がるような質感の濃いグレー
  header: '#0d1117', // ダークネイビー

  // アクセントカラー
  primary: '#D4AF37', // メタリックなゴールド
  secondary: '#C0C0C0', // シルバー（準主要）
  accent: '#FBC02D', // Added for compatibility
  bronze: '#CD7F32', // ブロンズ

  // テキスト色
  text: '#FFFFFF', // Default text color
  textPrimary: '#FFFFFF',
  textMain: '#FFFFFF', // Added for compatibility
  textSecondary: '#AAAAAA',
  textMuted: '#666666',
  textInverse: '#000000',

  // 機能色
  positive: '#00C853', // 鮮やかなエメラルド (上昇)
  negative: '#FF1744', // 警告感のあるレッド (下降)
  info: '#2196F3',
  warning: '#FFC107',
  
  // ボーダー・区切り線
  border: '#333333',
  
  // 特殊
  overlay: 'rgba(0, 0, 0, 0.7)',
  goldGradientStart: '#FDD835',
  goldGradientEnd: '#FBC02D',
  
  // チームカラー（既存のものがある場合はそちらと調整要だが、ダークテーマ用に彩度調整が必要かも）
};

export const FONTS = {
  // 日本語フォントはシステムのデフォルトに依存する。
  // システムフォントを使う場合は fontFamily を未指定にするのが React Native の推奨パターンのため、
  // ここでは undefined を指定して「システムデフォルトを使用する」ことを明示している。
  // 必要に応じて 'Roboto Mono' などフォント名を明示的に指定して上書きする。
  number: undefined,
  regular: undefined,
  bold: undefined,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const STYLES = {
  // 共通のカードスタイル
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12, // 12-16px
    padding: SPACING.md,
    marginBottom: SPACING.md,
    // 光沢感やシャドウ（React NativeのShadow Prop）
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#333', // わずかな境界線で立体感を
  },
  // グラスモーフィズム風（背景ぼかしはRNではBlurViewが必要だが、ここでは半透明で擬似的に）
  glassCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.3)', // 薄いゴールドの枠
  },
  // セクションヘッダー
  sectionHeader: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    paddingLeft: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
  }
} as const;
