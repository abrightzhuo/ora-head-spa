import type { Locale } from './store/useSiteStore'

type CustomerText = {
  account: string
  signIn: string
  signUp: string
  signOut: string
  close: string
  signInTitle: string
  signUpTitle: string
  signInIntro: string
  signUpIntro: string
  name: string
  phone: string
  email: string
  password: string
  confirmPassword: string
  createAccount: string
  noAccount: string
  registerLink: string
  hasAccount: string
  forgotPassword: string
  resetSent: string
  confirmEmail: string
  passwordMismatch: string
  passwordLength: string
  authFailed: string
  emailNotConfirmed: string
  resendConfirmation: string
  confirmationResent: string
  loginToPay: string
  continuePayment: string
  accountTitle: string
  accountIntro: string
  appointments: string
  giftCards: string
  noAppointments: string
  noGiftCards: string
  provider: string
  date: string
  payment: string
  paid: string
  cardEnding: string
  purchasedFor: string
  receivedFrom: string
  balance: string
  purchased: string
  received: string
  both: string
  active: string
  inactive: string
  expired: string
  loading: string
  loadFailed: string
  signInPrompt: string
  backHome: string
  status: Record<string, string>
}

export const customerCopy: Record<Locale, CustomerText> = {
  zh: {
    account: '我的账户', signIn: '登录', signUp: '注册', signOut: '退出登录', close: '关闭',
    signInTitle: '登录 ORA 账户', signUpTitle: '创建 ORA 账户',
    signInIntro: '登录后继续安全支付，并查看您的预约与礼品卡记录。',
    signUpIntro: '创建账户后，您的预约和礼品卡记录会自动保存在账户中。',
    name: '姓名', phone: '电话', email: '邮箱', password: '密码', confirmPassword: '确认密码',
    createAccount: '创建账户', noAccount: '还没有账户？', registerLink: '点击这里注册', hasAccount: '已有账户？',
    forgotPassword: '忘记密码', resetSent: '密码重置邮件已发送。',
    confirmEmail: '注册成功！确认邮件已发送，请前往邮箱并点击邮件中的确认链接，然后再登录。',
    passwordMismatch: '两次输入的密码不一致。', passwordLength: '密码至少需要 8 个字符。',
    authFailed: '操作失败，请检查邮箱和密码后重试。',
    emailNotConfirmed: '邮箱尚未确认。请先点击确认邮件中的链接。',
    resendConfirmation: '重新发送确认邮件', confirmationResent: '确认邮件已重新发送，请检查收件箱和垃圾邮件。',
    loginToPay: '支付前请先注册或登录。', continuePayment: '已登录，请再次点击支付继续。',
    accountTitle: '我的 ORA', accountIntro: '查看您的预约、付款和礼品卡记录。',
    appointments: '预约记录', giftCards: '礼品卡记录',
    noAppointments: '暂无预约记录。', noGiftCards: '暂无礼品卡记录。',
    provider: '技师', date: '时间', payment: '付款', paid: '已支付',
    cardEnding: '尾号', purchasedFor: '赠送给', receivedFrom: '来自',
    balance: '余额', purchased: '已购买', received: '已收到', both: '自购',
    active: '可使用', inactive: '已停用', expired: '已过期',
    loading: '正在加载记录...', loadFailed: '暂时无法加载账户记录。',
    signInPrompt: '登录后即可查看历史预约和礼品卡。', backHome: '返回首页',
    status: { pending: '已预约', checked_in: '已到店', in_service: '服务中', completed: '已完成', checked_out: '已结账', cancelled_or_changed_outside_24h: '提前24小时以上取消或更改', cancelled_or_changed_within_24h: '24小时内取消或更改', no_show_no_contact: '未到店且未提前联系' },
  },
  'zh-TW': {
    account: '我的帳戶', signIn: '登入', signUp: '註冊', signOut: '登出', close: '關閉',
    signInTitle: '登入 ORA 帳戶', signUpTitle: '建立 ORA 帳戶',
    signInIntro: '登入後繼續安全付款，並查看您的預約與禮品卡記錄。',
    signUpIntro: '建立帳戶後，您的預約和禮品卡記錄會自動保存在帳戶中。',
    name: '姓名', phone: '電話', email: '郵箱', password: '密碼', confirmPassword: '確認密碼',
    createAccount: '建立帳戶', noAccount: '還沒有帳戶？', registerLink: '點擊這裡註冊', hasAccount: '已有帳戶？',
    forgotPassword: '忘記密碼', resetSent: '密碼重設郵件已寄出。',
    confirmEmail: '註冊成功！確認郵件已發送，請前往郵箱並點擊郵件中的確認連結，然後再登入。',
    passwordMismatch: '兩次輸入的密碼不一致。', passwordLength: '密碼至少需要 8 個字元。',
    authFailed: '操作失敗，請檢查郵箱和密碼。',
    emailNotConfirmed: '郵箱尚未確認。請先點擊確認郵件中的連結。',
    resendConfirmation: '重新發送確認郵件', confirmationResent: '確認郵件已重新發送，請檢查收件箱和垃圾郵件。',
    loginToPay: '付款前請先註冊或登入。', continuePayment: '已登入，請再次點擊付款繼續。',
    accountTitle: '我的 ORA', accountIntro: '查看您的預約、付款和禮品卡記錄。',
    appointments: '預約記錄', giftCards: '禮品卡記錄',
    noAppointments: '暫無預約記錄。', noGiftCards: '暫無禮品卡記錄。',
    provider: '技師', date: '時間', payment: '付款', paid: '已付款',
    cardEnding: '尾號', purchasedFor: '贈送給', receivedFrom: '來自',
    balance: '餘額', purchased: '已購買', received: '已收到', both: '自購',
    active: '可使用', inactive: '已停用', expired: '已過期',
    loading: '正在載入記錄...', loadFailed: '暫時無法載入帳戶記錄。',
    signInPrompt: '登入後即可查看歷史預約和禮品卡。', backHome: '返回首頁',
    status: { pending: '已預約', checked_in: '已到店', in_service: '服務中', completed: '已完成', checked_out: '已結帳', cancelled_or_changed_outside_24h: '提前24小時以上取消或更改', cancelled_or_changed_within_24h: '24小時內取消或更改', no_show_no_contact: '未到店且未提前聯絡' },
  },
  en: {
    account: 'My account', signIn: 'Sign in', signUp: 'Register', signOut: 'Sign out', close: 'Close',
    signInTitle: 'Sign in to ORA', signUpTitle: 'Create your ORA account',
    signInIntro: 'Sign in to continue secure payment and view your bookings and gift cards.',
    signUpIntro: 'Create an account to keep your bookings and gift card history together.',
    name: 'Name', phone: 'Phone', email: 'Email', password: 'Password', confirmPassword: 'Confirm password',
    createAccount: 'Create account', noAccount: 'Don’t have an account?', registerLink: 'Register here', hasAccount: 'Already registered?',
    forgotPassword: 'Forgot password', resetSent: 'Password reset email sent.',
    confirmEmail: 'Account created! We sent you a confirmation email. Open it and select the confirmation link before signing in.',
    passwordMismatch: 'Passwords do not match.', passwordLength: 'Password must be at least 8 characters.',
    authFailed: 'Unable to continue. Check your email and password.',
    emailNotConfirmed: 'Your email is not confirmed. Open the confirmation link before signing in.',
    resendConfirmation: 'Resend confirmation email', confirmationResent: 'Confirmation email sent again. Check your inbox and spam folder.',
    loginToPay: 'Register or sign in before payment.', continuePayment: 'Signed in. Select payment again to continue.',
    accountTitle: 'My ORA', accountIntro: 'View your appointments, payments and gift cards.',
    appointments: 'Appointments', giftCards: 'Gift cards',
    noAppointments: 'No appointments yet.', noGiftCards: 'No gift card records yet.',
    provider: 'Provider', date: 'Date', payment: 'Payment', paid: 'Paid',
    cardEnding: 'Ending', purchasedFor: 'For', receivedFrom: 'From',
    balance: 'Balance', purchased: 'Purchased', received: 'Received', both: 'Self-purchased',
    active: 'Active', inactive: 'Inactive', expired: 'Expired',
    loading: 'Loading your records...', loadFailed: 'Your account records are temporarily unavailable.',
    signInPrompt: 'Sign in to view previous appointments and gift cards.', backHome: 'Back home',
    status: { pending: 'Booked', checked_in: 'Checked in', in_service: 'In service', completed: 'Completed', checked_out: 'Checked out', cancelled_or_changed_outside_24h: 'Cancelled/changed over 24h', cancelled_or_changed_within_24h: 'Cancelled/changed within 24h', no_show_no_contact: 'No-show without notice' },
  },
  es: {
    account: 'Mi cuenta', signIn: 'Iniciar sesión', signUp: 'Registrarse', signOut: 'Cerrar sesión', close: 'Cerrar',
    signInTitle: 'Inicia sesión en ORA', signUpTitle: 'Crea tu cuenta ORA',
    signInIntro: 'Inicia sesión para pagar y consultar tus reservas y tarjetas regalo.',
    signUpIntro: 'Crea una cuenta para guardar tus reservas y tarjetas regalo.',
    name: 'Nombre', phone: 'Teléfono', email: 'Correo electrónico', password: 'Contraseña', confirmPassword: 'Confirmar contraseña',
    createAccount: 'Crear cuenta', noAccount: '¿Aún no tienes cuenta?', registerLink: 'Regístrate aquí', hasAccount: '¿Ya tienes cuenta?',
    forgotPassword: 'Olvidé mi contraseña', resetSent: 'Correo de restablecimiento enviado.',
    confirmEmail: '¡Cuenta creada! Te enviamos un correo de confirmación. Ábrelo y selecciona el enlace antes de iniciar sesión.',
    passwordMismatch: 'Las contraseñas no coinciden.', passwordLength: 'La contraseña debe tener al menos 8 caracteres.',
    authFailed: 'No se pudo continuar. Revisa tus datos.',
    emailNotConfirmed: 'Tu correo aún no está confirmado. Abre el enlace de confirmación antes de iniciar sesión.',
    resendConfirmation: 'Reenviar correo de confirmación', confirmationResent: 'Correo de confirmación reenviado. Revisa tu bandeja de entrada y spam.',
    loginToPay: 'Regístrate o inicia sesión antes de pagar.', continuePayment: 'Sesión iniciada. Vuelve a pulsar pagar.',
    accountTitle: 'Mi ORA', accountIntro: 'Consulta tus citas, pagos y tarjetas regalo.',
    appointments: 'Citas', giftCards: 'Tarjetas regalo', noAppointments: 'Aún no hay citas.', noGiftCards: 'Aún no hay tarjetas regalo.',
    provider: 'Especialista', date: 'Fecha', payment: 'Pago', paid: 'Pagado', cardEnding: 'Terminada en',
    purchasedFor: 'Para', receivedFrom: 'De', balance: 'Saldo', purchased: 'Comprada', received: 'Recibida', both: 'Compra propia',
    active: 'Activa', inactive: 'Inactiva', expired: 'Caducada', loading: 'Cargando registros...', loadFailed: 'No se pueden cargar los registros.',
    signInPrompt: 'Inicia sesión para ver tus citas y tarjetas regalo.', backHome: 'Volver al inicio',
    status: { pending: 'Reservada', checked_in: 'Registrada', in_service: 'En servicio', completed: 'Completada', checked_out: 'Pagada', cancelled_or_changed_outside_24h: 'Cancelada/cambiada con más de 24 h', cancelled_or_changed_within_24h: 'Cancelada/cambiada dentro de 24 h', no_show_no_contact: 'No asistió ni avisó' },
  },
  fr: {
    account: 'Mon compte', signIn: 'Se connecter', signUp: 'S’inscrire', signOut: 'Se déconnecter', close: 'Fermer',
    signInTitle: 'Connexion à ORA', signUpTitle: 'Créer votre compte ORA',
    signInIntro: 'Connectez-vous pour payer et consulter vos rendez-vous et cartes cadeaux.',
    signUpIntro: 'Créez un compte pour conserver vos rendez-vous et cartes cadeaux.',
    name: 'Nom', phone: 'Téléphone', email: 'E-mail', password: 'Mot de passe', confirmPassword: 'Confirmer le mot de passe',
    createAccount: 'Créer le compte', noAccount: 'Vous n’avez pas de compte ?', registerLink: 'Inscrivez-vous ici', hasAccount: 'Déjà inscrit ?',
    forgotPassword: 'Mot de passe oublié', resetSent: 'E-mail de réinitialisation envoyé.',
    confirmEmail: 'Compte créé ! Un e-mail de confirmation vous a été envoyé. Ouvrez-le et cliquez sur le lien avant de vous connecter.',
    passwordMismatch: 'Les mots de passe ne correspondent pas.', passwordLength: 'Le mot de passe doit contenir au moins 8 caractères.',
    authFailed: 'Impossible de continuer. Vérifiez vos informations.',
    emailNotConfirmed: 'Votre adresse e-mail n’est pas confirmée. Ouvrez le lien de confirmation avant de vous connecter.',
    resendConfirmation: 'Renvoyer l’e-mail de confirmation', confirmationResent: 'E-mail de confirmation renvoyé. Vérifiez votre boîte de réception et vos indésirables.',
    loginToPay: 'Inscrivez-vous ou connectez-vous avant de payer.', continuePayment: 'Connecté. Cliquez de nouveau sur payer.',
    accountTitle: 'Mon ORA', accountIntro: 'Consultez vos rendez-vous, paiements et cartes cadeaux.',
    appointments: 'Rendez-vous', giftCards: 'Cartes cadeaux', noAppointments: 'Aucun rendez-vous.', noGiftCards: 'Aucune carte cadeau.',
    provider: 'Spécialiste', date: 'Date', payment: 'Paiement', paid: 'Payé', cardEnding: 'Fin',
    purchasedFor: 'Pour', receivedFrom: 'De', balance: 'Solde', purchased: 'Achetée', received: 'Reçue', both: 'Achat personnel',
    active: 'Active', inactive: 'Inactive', expired: 'Expirée', loading: 'Chargement...', loadFailed: 'Impossible de charger vos données.',
    signInPrompt: 'Connectez-vous pour consulter votre historique.', backHome: 'Retour à l’accueil',
    status: { pending: 'Réservé', checked_in: 'Arrivé', in_service: 'En soin', completed: 'Terminé', checked_out: 'Réglé', cancelled_or_changed_outside_24h: 'Annulé/modifié plus de 24 h avant', cancelled_or_changed_within_24h: 'Annulé/modifié dans les 24 h', no_show_no_contact: 'Absent sans préavis' },
  },
  ja: {
    account: 'マイアカウント', signIn: 'ログイン', signUp: '登録', signOut: 'ログアウト', close: '閉じる',
    signInTitle: 'ORAにログイン', signUpTitle: 'ORAアカウントを作成',
    signInIntro: 'ログインして決済を続け、予約とギフトカードを確認できます。',
    signUpIntro: 'アカウントを作成すると予約とギフトカード履歴を保存できます。',
    name: '氏名', phone: '電話番号', email: 'メール', password: 'パスワード', confirmPassword: 'パスワード確認',
    createAccount: 'アカウント作成', noAccount: 'アカウントをお持ちでない方', registerLink: 'こちらから登録', hasAccount: '登録済みの方',
    forgotPassword: 'パスワードを忘れた', resetSent: '再設定メールを送信しました。',
    confirmEmail: '登録が完了しました。確認メールを送信しました。メール内の確認リンクを開いてからログインしてください。',
    passwordMismatch: 'パスワードが一致しません。', passwordLength: 'パスワードは8文字以上必要です。',
    authFailed: '続行できません。入力内容をご確認ください。',
    emailNotConfirmed: 'メールアドレスが未確認です。確認メールのリンクを開いてからログインしてください。',
    resendConfirmation: '確認メールを再送', confirmationResent: '確認メールを再送しました。受信トレイと迷惑メールをご確認ください。',
    loginToPay: 'お支払い前に登録またはログインしてください。', continuePayment: 'ログインしました。もう一度決済を選択してください。',
    accountTitle: 'My ORA', accountIntro: '予約、支払い、ギフトカードを確認できます。',
    appointments: '予約履歴', giftCards: 'ギフトカード', noAppointments: '予約はありません。', noGiftCards: 'ギフトカードはありません。',
    provider: '担当者', date: '日時', payment: '支払い', paid: '支払済み', cardEnding: '末尾',
    purchasedFor: '贈り先', receivedFrom: '贈り主', balance: '残高', purchased: '購入済み', received: '受取済み', both: '自分用',
    active: '利用可能', inactive: '停止中', expired: '期限切れ', loading: '読み込み中...', loadFailed: '履歴を読み込めません。',
    signInPrompt: 'ログインして予約とギフトカードを確認してください。', backHome: 'ホームへ戻る',
    status: { pending: '予約済み', checked_in: '来店済み', in_service: '施術中', completed: '完了', checked_out: '会計済み', cancelled_or_changed_outside_24h: '24時間より前のキャンセル・変更', cancelled_or_changed_within_24h: '24時間以内のキャンセル・変更', no_show_no_contact: '連絡なしの未来店' },
  },
  ko: {
    account: '내 계정', signIn: '로그인', signUp: '회원가입', signOut: '로그아웃', close: '닫기',
    signInTitle: 'ORA 로그인', signUpTitle: 'ORA 계정 만들기',
    signInIntro: '로그인 후 결제를 계속하고 예약 및 기프트 카드 기록을 확인하세요.',
    signUpIntro: '계정을 만들면 예약과 기프트 카드 기록이 저장됩니다.',
    name: '이름', phone: '전화번호', email: '이메일', password: '비밀번호', confirmPassword: '비밀번호 확인',
    createAccount: '계정 만들기', noAccount: '계정이 없으신가요?', registerLink: '여기에서 가입', hasAccount: '이미 계정이 있나요?',
    forgotPassword: '비밀번호 찾기', resetSent: '재설정 이메일을 보냈습니다.',
    confirmEmail: '가입이 완료되었습니다. 확인 이메일을 보냈습니다. 이메일의 확인 링크를 누른 후 로그인해 주세요.',
    passwordMismatch: '비밀번호가 일치하지 않습니다.', passwordLength: '비밀번호는 8자 이상이어야 합니다.',
    authFailed: '계속할 수 없습니다. 입력 내용을 확인해 주세요.',
    emailNotConfirmed: '이메일이 아직 확인되지 않았습니다. 확인 메일의 링크를 연 후 로그인해 주세요.',
    resendConfirmation: '확인 이메일 다시 보내기', confirmationResent: '확인 이메일을 다시 보냈습니다. 받은편지함과 스팸함을 확인해 주세요.',
    loginToPay: '결제 전에 가입하거나 로그인해 주세요.', continuePayment: '로그인되었습니다. 결제를 다시 눌러 주세요.',
    accountTitle: 'My ORA', accountIntro: '예약, 결제 및 기프트 카드 기록을 확인하세요.',
    appointments: '예약 기록', giftCards: '기프트 카드', noAppointments: '예약 기록이 없습니다.', noGiftCards: '기프트 카드 기록이 없습니다.',
    provider: '테라피스트', date: '일시', payment: '결제', paid: '결제 완료', cardEnding: '끝자리',
    purchasedFor: '받는 분', receivedFrom: '보낸 분', balance: '잔액', purchased: '구매', received: '수령', both: '본인 구매',
    active: '사용 가능', inactive: '사용 중지', expired: '만료', loading: '기록 불러오는 중...', loadFailed: '기록을 불러올 수 없습니다.',
    signInPrompt: '로그인하여 예약과 기프트 카드를 확인하세요.', backHome: '홈으로',
    status: { pending: '예약됨', checked_in: '체크인', in_service: '서비스 중', completed: '완료', checked_out: '결제 완료', cancelled_or_changed_outside_24h: '24시간 이전 취소/변경', cancelled_or_changed_within_24h: '24시간 이내 취소/변경', no_show_no_contact: '사전 연락 없는 노쇼' },
  },
  de: {
    account: 'Mein Konto', signIn: 'Anmelden', signUp: 'Registrieren', signOut: 'Abmelden', close: 'Schließen',
    signInTitle: 'Bei ORA anmelden', signUpTitle: 'ORA-Konto erstellen',
    signInIntro: 'Melden Sie sich an, um zu bezahlen und Ihre Termine und Geschenkkarten zu sehen.',
    signUpIntro: 'Erstellen Sie ein Konto für Ihre Termin- und Geschenkkartenhistorie.',
    name: 'Name', phone: 'Telefon', email: 'E-Mail', password: 'Passwort', confirmPassword: 'Passwort bestätigen',
    createAccount: 'Konto erstellen', noAccount: 'Noch kein Konto?', registerLink: 'Hier registrieren', hasAccount: 'Bereits registriert?',
    forgotPassword: 'Passwort vergessen', resetSent: 'E-Mail zum Zurücksetzen wurde gesendet.',
    confirmEmail: 'Konto erstellt! Wir haben eine Bestätigungs-E-Mail gesendet. Öffnen Sie sie und klicken Sie vor der Anmeldung auf den Bestätigungslink.',
    passwordMismatch: 'Die Passwörter stimmen nicht überein.', passwordLength: 'Das Passwort muss mindestens 8 Zeichen lang sein.',
    authFailed: 'Vorgang fehlgeschlagen. Bitte Angaben prüfen.',
    emailNotConfirmed: 'Ihre E-Mail-Adresse ist noch nicht bestätigt. Öffnen Sie vor der Anmeldung den Bestätigungslink.',
    resendConfirmation: 'Bestätigungs-E-Mail erneut senden', confirmationResent: 'Bestätigungs-E-Mail erneut gesendet. Prüfen Sie Posteingang und Spamordner.',
    loginToPay: 'Bitte vor der Zahlung registrieren oder anmelden.', continuePayment: 'Angemeldet. Bitte Zahlung erneut wählen.',
    accountTitle: 'Mein ORA', accountIntro: 'Termine, Zahlungen und Geschenkkarten anzeigen.',
    appointments: 'Termine', giftCards: 'Geschenkkarten', noAppointments: 'Noch keine Termine.', noGiftCards: 'Noch keine Geschenkkarten.',
    provider: 'Behandler', date: 'Datum', payment: 'Zahlung', paid: 'Bezahlt', cardEnding: 'Endziffern',
    purchasedFor: 'Für', receivedFrom: 'Von', balance: 'Guthaben', purchased: 'Gekauft', received: 'Erhalten', both: 'Eigenkauf',
    active: 'Aktiv', inactive: 'Inaktiv', expired: 'Abgelaufen', loading: 'Daten werden geladen...', loadFailed: 'Daten können nicht geladen werden.',
    signInPrompt: 'Anmelden, um Termine und Geschenkkarten zu sehen.', backHome: 'Zur Startseite',
    status: { pending: 'Gebucht', checked_in: 'Eingecheckt', in_service: 'In Behandlung', completed: 'Abgeschlossen', checked_out: 'Bezahlt', cancelled_or_changed_outside_24h: 'Über 24 Std. vorher storniert/geändert', cancelled_or_changed_within_24h: 'Innerhalb 24 Std. storniert/geändert', no_show_no_contact: 'Ohne Nachricht nicht erschienen' },
  },
  ru: {
    account: 'Мой аккаунт', signIn: 'Войти', signUp: 'Регистрация', signOut: 'Выйти', close: 'Закрыть',
    signInTitle: 'Вход в ORA', signUpTitle: 'Создать аккаунт ORA',
    signInIntro: 'Войдите, чтобы продолжить оплату и просматривать записи и подарочные карты.',
    signUpIntro: 'Создайте аккаунт, чтобы сохранять историю записей и подарочных карт.',
    name: 'Имя', phone: 'Телефон', email: 'Эл. почта', password: 'Пароль', confirmPassword: 'Подтвердите пароль',
    createAccount: 'Создать аккаунт', noAccount: 'Нет аккаунта?', registerLink: 'Зарегистрироваться здесь', hasAccount: 'Уже зарегистрированы?',
    forgotPassword: 'Забыли пароль', resetSent: 'Письмо для сброса пароля отправлено.',
    confirmEmail: 'Аккаунт создан! Мы отправили письмо с подтверждением. Откройте его и перейдите по ссылке перед входом.',
    passwordMismatch: 'Пароли не совпадают.', passwordLength: 'Пароль должен содержать не менее 8 символов.',
    authFailed: 'Не удалось продолжить. Проверьте данные.',
    emailNotConfirmed: 'Адрес электронной почты не подтверждён. Перед входом откройте ссылку из письма.',
    resendConfirmation: 'Отправить письмо повторно', confirmationResent: 'Письмо отправлено повторно. Проверьте входящие и папку «Спам».',
    loginToPay: 'Перед оплатой зарегистрируйтесь или войдите.', continuePayment: 'Вход выполнен. Нажмите оплатить еще раз.',
    accountTitle: 'Мой ORA', accountIntro: 'Ваши записи, платежи и подарочные карты.',
    appointments: 'Записи', giftCards: 'Подарочные карты', noAppointments: 'Записей пока нет.', noGiftCards: 'Подарочных карт пока нет.',
    provider: 'Специалист', date: 'Дата', payment: 'Оплата', paid: 'Оплачено', cardEnding: 'Последние цифры',
    purchasedFor: 'Для', receivedFrom: 'От', balance: 'Баланс', purchased: 'Куплено', received: 'Получено', both: 'Для себя',
    active: 'Активна', inactive: 'Неактивна', expired: 'Истекла', loading: 'Загрузка...', loadFailed: 'Не удалось загрузить данные.',
    signInPrompt: 'Войдите, чтобы посмотреть записи и подарочные карты.', backHome: 'На главную',
    status: { pending: 'Забронировано', checked_in: 'Прибыл', in_service: 'Обслуживается', completed: 'Завершена', checked_out: 'Оплачена', cancelled_or_changed_outside_24h: 'Отмена/изменение более чем за 24 ч', cancelled_or_changed_within_24h: 'Отмена/изменение в течение 24 ч', no_show_no_contact: 'Не явился без предупреждения' },
  },
}
