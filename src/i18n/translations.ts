export type Lang = 'ar' | 'en';

export const translations: Record<Lang, Record<string, string>> = {
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم',
    users: 'المستخدمين',
    tribes: 'الفرق',
    levels: 'المستويات',
    sessions: 'المجموعات',
    quizzes: 'المسابقات',
    xp: 'النقاط والترتيب',
    bonus: 'المكافآت',
    publications: 'المنشورات',
    settings: 'الإعدادات',
    logout: 'تسجيل خروج',

    // Sports/Tournament
    sports: 'الرياضة',
    tournaments: 'البطولات',
    createTournament: 'إنشاء بطولة',
    tournament: 'البطولة',
    tournamentName: 'اسم البطولة',
    tournamentNameEn: 'اسم البطولة (إنجليزي)',
    tournamentNameAr: 'اسم البطولة (عربي)',
    tournamentDescription: 'وصف البطولة',
    tournamentDescriptionEn: 'وصف البطولة (إنجليزي)',
    tournamentDescriptionAr: 'وصف البطولة (عربي)',
    startDate: 'تاريخ البدء',
    endDate: 'تاريخ الانتهاء',
    status: 'الحالة',
    planning: 'قيد التخطيط',
    groupStage: 'مرحلة المجموعات',
    knockout: 'مرحلة الإقصاء',
    completed: 'مكتملة',

    // Group Configuration
    groupStageConfig: 'إعدادات مرحلة المجموعات',
    numberOfGroups: 'عدد المجموعات',
    teamsPerGroup: 'عدد الفرق في المجموعة',
    teamsAdvancingPerGroup: 'عدد الفرق المتأهلة من المجموعة',

    // Points Configuration
    pointsConfig: 'إعدادات النقاط',
    pointsForWin: 'نقاط الفوز',
    pointsForDraw: 'نقاط التعادل',
    pointsForLoss: 'نقاط الخسارة',

    // XP Configuration
    xpConfig: 'إعدادات نقاط الخبرة',
    groupStageWinXp: 'نقاط الخبرة - فوز في المجموعة',
    groupStageDrawXp: 'نقاط الخبرة - تعادل في المجموعة',
    groupStageLossXp: 'نقاط الخبرة - خسارة في المجموعة',
    quarterFinalWinXp: 'نقاط الخبرة - فوز في ربع النهائي',
    quarterFinalLossXp: 'نقاط الخبرة - خسارة في ربع النهائي',
    semiFinalWinXp: 'نقاط الخبرة - فوز في نصف النهائي',
    semiFinalLossXp: 'نقاط الخبرة - خسارة في نصف النهائي',
    finalWinnerXp: 'نقاط الخبرة - البطل',
    finalRunnerUpXp: 'نقاط الخبرة - الوصيف',

    // Member Restrictions
    memberRestrictions: 'قيود أعضاء الفريق',
    memberRestrictionType: 'نوع القيد',
    restrictionValue: 'قيمة القيد',
    noRestriction: 'بدون قيود',
    restrictByTribe: 'تقيد بالفريق',
    restrictByDiocese: 'تقيد بالأبرشية',
    restrictByChurch: 'تقيد بالكنيسة',
    selectRestrictionType: 'اختر نوع القيد',
    selectTribe: 'اختر الفريق',
    selectDiocese: 'اختر الأبرشية',
    selectChurch: 'اختر الكنيسة',
    memberRestrictionHelp: 'اختر هذا لتحديد المتطلبات الأساسية لأعضاء الفريق في هذه البطولة',

    // Actions
    save: 'حفظ',
    cancel: 'إلغاء',
    create: 'إنشاء',
    edit: 'تعديل',
    delete: 'حذف',
    configure: 'إعدادات',
    generateKnockout: 'توليد مرحلة الإقصاء',
    assignTeams: 'تعيين الفرق',
    generateMatches: 'توليد المباريات',
    
    // Group Standings
    groupStandings: 'جدول ترتيب المجموعة',
    team: 'الفريق',
    played: 'ع',
    wins: 'ف',
    draws: 'ت',
    losses: 'خ',
    goalsFor: 'ل',
    goalsAgainst: 'ض',
    goalDifference: 'الفرق',
    points: 'النقاط',

    // Knockout Bracket
    knockoutBracket: 'قوس الإقصاء',
    quarterFinals: 'ربع النهائي',
    semiFinals: 'نصف النهائي',
    final: 'النهائي',
    
    // Messages
    tournamentCreated: 'تم إنشاء البطولة بنجاح',
    tournamentUpdated: 'تم تحديث البطولة بنجاح',
    tournamentsLoading: 'جاري تحميل البطولات...',
    noTournaments: 'لا توجد بطولات',
    error: 'حدث خطأ',
    success: 'تم بنجاح',
    failed: 'فشل',
    requiredField: 'هذا الحقل مطلوب',
    invalidValue: 'قيمة غير صحيحة',

    // Team Management
    teams: 'الفرق',
    teamName: 'اسم الفريق',
    captain: 'الكابتن',
    members: 'الأعضاء',
    addTeam: 'إضافة فريق',
    selectTeam: 'اختر فريق',
    teamMembers: 'أعضاء الفريق',

    // Standings Table Headers
    position: 'المركز',
    teamColumn: 'الفريق',
    matchesPlayed: 'المباريات',
    qualified: 'متأهل',

    // Language
    language: 'اللغة',
    arabic: 'العربية',
    english: 'English',
    en: 'English',
    ar: 'العربية',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    users: 'Users',
    tribes: 'Tribes',
    levels: 'Levels',
    sessions: 'Sessions',
    quizzes: 'Quizzes',
    xp: 'XP & Leaderboard',
    bonus: 'Bonus',
    publications: 'Publications',
    settings: 'Settings',
    logout: 'Logout',

    // Sports/Tournament
    sports: 'Sports',
    tournaments: 'Tournaments',
    createTournament: 'Create Tournament',
    tournament: 'Tournament',
    tournamentName: 'Tournament Name',
    tournamentNameEn: 'Tournament Name (English)',
    tournamentNameAr: 'Tournament Name (Arabic)',
    tournamentDescription: 'Description',
    tournamentDescriptionEn: 'Description (English)',
    tournamentDescriptionAr: 'Description (Arabic)',
    startDate: 'Start Date',
    endDate: 'End Date',
    status: 'Status',
    planning: 'Planning',
    groupStage: 'Group Stage',
    knockout: 'Knockout',
    completed: 'Completed',

    // Group Configuration
    groupStageConfig: 'Group Stage Configuration',
    numberOfGroups: 'Number of Groups',
    teamsPerGroup: 'Teams Per Group',
    teamsAdvancingPerGroup: 'Teams Advancing Per Group',

    // Points Configuration
    pointsConfig: 'Points Configuration',
    pointsForWin: 'Points for Win',
    pointsForDraw: 'Points for Draw',
    pointsForLoss: 'Points for Loss',

    // XP Configuration
    xpConfig: 'XP Configuration',
    groupStageWinXp: 'XP - Group Stage Win',
    groupStageDrawXp: 'XP - Group Stage Draw',
    groupStageLossXp: 'XP - Group Stage Loss',
    quarterFinalWinXp: 'XP - Quarter Final Win',
    quarterFinalLossXp: 'XP - Quarter Final Loss',
    semiFinalWinXp: 'XP - Semi Final Win',
    semiFinalLossXp: 'XP - Semi Final Loss',
    finalWinnerXp: 'XP - Champion',
    finalRunnerUpXp: 'XP - Runner Up',

    // Member Restrictions
    memberRestrictions: 'Member Restrictions',
    memberRestrictionType: 'Restriction Type',
    restrictionValue: 'Restriction Value',
    noRestriction: 'No Restrictions',
    restrictByTribe: 'Restrict by Tribe',
    restrictByDiocese: 'Restrict by Diocese',
    restrictByChurch: 'Restrict by Church',
    selectRestrictionType: 'Select Restriction Type',
    selectTribe: 'Select Tribe',
    selectDiocese: 'Select Diocese',
    selectChurch: 'Select Church',
    memberRestrictionHelp: 'Select this to enforce membership requirements for teams in this tournament',

    // Actions
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    configure: 'Configure',
    generateKnockout: 'Generate Knockout Stage',
    assignTeams: 'Assign Teams',
    generateMatches: 'Generate Matches',

    // Group Standings
    groupStandings: 'Group Standings',
    team: 'Team',
    played: 'P',
    wins: 'W',
    draws: 'D',
    losses: 'L',
    goalsFor: 'GF',
    goalsAgainst: 'GA',
    goalDifference: 'GD',
    points: 'Pts',

    // Knockout Bracket
    knockoutBracket: 'Knockout Bracket',
    quarterFinals: 'Quarter Finals',
    semiFinals: 'Semi Finals',
    final: 'Final',

    // Messages
    tournamentCreated: 'Tournament created successfully',
    tournamentUpdated: 'Tournament updated successfully',
    tournamentsLoading: 'Loading tournaments...',
    noTournaments: 'No tournaments found',
    error: 'Error',
    success: 'Success',
    failed: 'Failed',
    requiredField: 'This field is required',
    invalidValue: 'Invalid value',

    // Team Management
    teams: 'Teams',
    teamName: 'Team Name',
    captain: 'Captain',
    members: 'Members',
    addTeam: 'Add Team',
    selectTeam: 'Select Team',
    teamMembers: 'Team Members',

    // Standings Table Headers
    position: 'Position',
    teamColumn: 'Team',
    matchesPlayed: 'Matches Played',
    qualified: 'Qualified',

    // Language
    language: 'Language',
    arabic: 'العربية',
    english: 'English',
    en: 'English',
    ar: 'العربية',
  },
};
