export const STORAGE_KEY = "clinic-ai-workbench-v2";
export const AUTH_SCHEMA_VERSION = 3;

export const ROLE_LABELS = {
  guide: "导医",
  doctor: "医生",
  therapist: "治疗师",
  followup: "回访",
  director: "院长",
  admin: "管理员"
};

export const EMR_STATUS = ["草稿", "已提交", "已签名", "已归档", "修订中"];

export const VITILIGO_TEMPLATE_DEFAULTS = {
  onsetDate: "",
  diseaseType: "待分型",
  stage: "待评估",
  bodySites: "",
  color: "",
  boundary: "",
  surface: "",
  woodLamp: "",
  areaPercent: "",
  hairWhitening: "未记录",
  koebner: "未记录",
  familyHistory: "",
  triggerFactors: "",
  previousTreatment: "",
  lifestyleSleep: "",
  comorbidity: ""
};

export const VITILIGO_TEMPLATE_LABELS = {
  onsetDate: "发病时间",
  diseaseType: "白癜风分型",
  stage: "病情分期",
  bodySites: "白斑部位",
  color: "白斑颜色",
  boundary: "边界情况",
  surface: "表面状态",
  woodLamp: "伍德灯表现",
  areaPercent: "面积估算",
  hairWhitening: "毛发变白",
  koebner: "同形反应",
  familyHistory: "家族史",
  triggerFactors: "诱发因素",
  previousTreatment: "既往治疗",
  lifestyleSleep: "生活/睡眠",
  comorbidity: "共病情况"
};

export const BODY_REGION_DEFINITIONS = [
  { id: "face", label: "面部", short: "面", group: "头面颈", hint: "面部白斑评分可单独观察" },
  { id: "headNeck", label: "头颈", short: "颈", group: "头面颈", hint: "头皮、耳部、颈部" },
  { id: "trunk", label: "躯干", short: "躯", group: "躯干", hint: "胸背腹腰" },
  { id: "upperLimbs", label: "上肢", short: "臂", group: "四肢", hint: "上臂、前臂、腋区" },
  { id: "hands", label: "手部", short: "手", group: "肢端", hint: "手背、指背为主" },
  { id: "lowerLimbs", label: "下肢", short: "腿", group: "四肢", hint: "大腿、小腿、臀部" },
  { id: "feet", label: "足部", short: "足", group: "肢端", hint: "足背、趾背为主" }
];

export const VASI_DEPIGMENTATION_OPTIONS = [100, 90, 75, 50, 25, 10];

const ROLE_PERMISSIONS = {
  guide: [
    "patient:list",
    "patient:create",
    "patient:basic",
    "registration:create",
    "registration:update",
    "queue:view"
  ],
  doctor: [
    "patient:list",
    "patient:basic",
    "record:read",
    "record:write",
    "record:sign",
    "specialty:view",
    "specialty:write",
    "exam:write",
    "image:view",
    "image:write",
    "treatment:write",
    "phototherapy:write",
    "followup:write",
    "order:create",
    "prescription:create",
    "queue:view",
    "queue:accept"
  ],
  therapist: [
    "patient:list",
    "patient:basic",
    "specialty:view",
    "image:view",
    "treatment:write",
    "phototherapy:write",
    "queue:view"
  ],
  followup: [
    "patient:list",
    "patient:basic",
    "followup:write",
    "queue:view"
  ],
  director: [
    "patient:list",
    "patient:basic",
    "record:read",
    "specialty:view",
    "image:view",
    "sales:view",
    "prescription:view",
    "prescription:review",
    "registration:create",
    "registration:update",
    "queue:view",
    "dashboard:view",
    "audit:view",
    "cross_department:view",
    "export:data",
    "settings:view"
  ],
  admin: ["*"]
};

export const DEFAULT_ROLES = [
  { id: "guide", name: "导医", permissions: ROLE_PERMISSIONS.guide, moduleAccess: ["guide", "patients"], builtIn: true },
  { id: "doctor", name: "医生", permissions: ROLE_PERMISSIONS.doctor, moduleAccess: ["patients"], builtIn: true },
  { id: "therapist", name: "治疗师", permissions: ROLE_PERMISSIONS.therapist, moduleAccess: ["patients"], builtIn: true },
  { id: "followup", name: "回访", permissions: ROLE_PERMISSIONS.followup, moduleAccess: ["patients"], builtIn: true },
  { id: "director", name: "院长", permissions: ROLE_PERMISSIONS.director, moduleAccess: ["patients", "director", "settings", "audit"], builtIn: true },
  { id: "admin", name: "管理员", permissions: ROLE_PERMISSIONS.admin, moduleAccess: ["guide", "patients", "director", "settings", "audit"], builtIn: true }
];

export const DEMO_DEPARTMENTS = [
  { id: "dept-initial", name: "初诊科", type: "临床", enabled: true },
  { id: "dept-follow", name: "复诊科", type: "临床", enabled: true },
  { id: "dept-light", name: "光疗室", type: "治疗", enabled: true },
  { id: "dept-exam", name: "检查室", type: "检查", enabled: true },
  { id: "dept-consult", name: "咨询室", type: "咨询", enabled: true },
  { id: "dept-callback", name: "回访组", type: "随访", enabled: true }
];

export const DEMO_USERS = [
  {
    id: "u-guide",
    loginName: "导医001",
    name: "赵导医",
    role: "guide",
    departmentIds: ["dept-initial", "dept-follow", "dept-light", "dept-exam", "dept-consult"],
    moduleAccess: ["guide", "patients"],
    enabled: true
  },
  {
    id: "u-doctor-he",
    loginName: "医生001",
    name: "何医生",
    role: "doctor",
    departmentIds: ["dept-initial", "dept-follow"],
    moduleAccess: ["patients"],
    enabled: true
  },
  {
    id: "u-doctor-zhang",
    loginName: "医生002",
    name: "张医生",
    role: "doctor",
    departmentIds: ["dept-follow", "dept-initial"],
    moduleAccess: ["patients"],
    enabled: true
  },
  {
    id: "u-therapist",
    loginName: "治疗师001",
    name: "刘治疗师",
    role: "therapist",
    departmentIds: ["dept-light"],
    moduleAccess: ["patients"],
    enabled: true
  },
  {
    id: "u-callback",
    loginName: "回访001",
    name: "王回访",
    role: "followup",
    departmentIds: ["dept-callback", "dept-follow"],
    moduleAccess: ["patients"],
    enabled: true
  },
  {
    id: "u-director",
    loginName: "院长001",
    name: "周院长",
    role: "director",
    departmentIds: DEMO_DEPARTMENTS.map((department) => department.id),
    moduleAccess: ["patients", "director", "settings", "audit"],
    enabled: true
  },
  {
    id: "u-admin",
    loginName: "管理员001",
    name: "系统管理员",
    role: "admin",
    departmentIds: DEMO_DEPARTMENTS.map((department) => department.id),
    moduleAccess: ["guide", "patients", "director", "settings", "audit"],
    enabled: true
  }
];

export const DEMO_PATIENTS = [
  {
    id: "P20260314-001",
    nameAlias: "患者A",
    age: 19,
    gender: "女",
    tag: "进展期-沟通中",
    source: "学生转诊",
    status: "治疗中",
    departmentId: "dept-initial",
    ownerUserId: "u-doctor-he",
    doctor: "何医生",
    contact: "",
    createdAt: "2026-03-14",
    medicalRecord: {
      recordNo: "MR-P20260314-001",
      emrStatus: "已签名",
      version: 1,
      signedBy: "u-doctor-he",
      signedAt: "2026-03-14 10:12",
      submittedAt: "2026-03-14 09:58",
      archivedAt: "",
      revisionReason: "",
      aiSummaryConfirmedBy: "",
      aiSummaryConfirmedAt: "",
      chiefComplaint: "面部白斑约5月余，近期边界较前更明显。",
      presentIllness: "患者曾于外院诊断为白癜风，接受308光疗。近1个月面颈部白斑较前扩大，额部、口周及眉周色素减退明显。",
      pastHistory: "否认甲状腺疾病史，否认药物及食物过敏史。",
      exam: "面部散在色素脱失斑，伍德灯下呈亮白色荧光，边界较清晰；体重指数 21.6，精神状态可。",
      diagnosis: "白癜风，进展期",
      plan: "建议规律光疗联合外用药，建立4周复诊与每周回访。",
      vitiligoAssessment: {
        onsetDate: "2025-10",
        diseaseType: "寻常型",
        stage: "进展期",
        bodySites: "额部、口周、眉周、颈部",
        color: "瓷白色为主",
        boundary: "边界较清晰",
        surface: "表面光滑，无鳞屑",
        woodLamp: "伍德灯下亮白色荧光，边界清晰",
        areaPercent: "约4.8%",
        hairWhitening: "眉周少量毛发颜色变浅",
        koebner: "未见明确同形反应",
        familyHistory: "否认明确家族史",
        triggerFactors: "近期作息偏晚、精神压力较大",
        previousTreatment: "外院曾行308光疗",
        lifestyleSleep: "学生，睡眠偏晚",
        comorbidity: "暂未见甲状腺疾病证据"
      },
      versions: []
    },
    imageTimeline: [
      {
        id: "IMG-001",
        date: "2026-03-14",
        bodySite: "面部/口周",
        mode: "伍德灯",
        aiAreaPercent: "4.8",
        doctorConfirmed: "已确认",
        note: "演示数据仅保存照片说明，不含真实影像。"
      }
    ],
    examReports: [
      {
        id: "E-001",
        date: "2026-03-14",
        type: "伍德灯检查",
        area: "面颈部约16处",
        result: "额部、口周及眉周可见亮白色荧光，边界清晰。",
        photoNote: "不采集真实照片，演示数据已脱敏。"
      }
    ],
    treatmentPlans: [
      {
        id: "T-001",
        date: "2026-03-14",
        medication: "外用药物 + 辅助口服药，按医嘱记录",
        phototherapy: "308光疗，每周2-3次",
        dose: "180mJ/cm2 起始",
        reaction: "轻微红斑，可耐受",
        course: "首期15天，4周评估",
        nextVisit: "2026-03-28",
        notes: "需提醒患者坚持疗程并观察刺激反应。"
      }
    ],
    phototherapySessions: [
      {
        id: "PT-001",
        date: "2026-03-14",
        device: "308准分子光",
        bodySite: "面部/口周",
        doseMj: 180,
        durationSeconds: 8,
        erythema: "轻微红斑",
        operatorUserId: "u-therapist",
        nextDosePlan: "下次维持或小幅调整，需医生确认",
        note: "演示记录，仅追踪执行剂量。"
      },
      {
        id: "PT-002",
        date: "2026-03-21",
        device: "308准分子光",
        bodySite: "面部/口周",
        doseMj: 200,
        durationSeconds: 9,
        erythema: "可耐受",
        operatorUserId: "u-therapist",
        nextDosePlan: "复诊后决定",
        note: "无明显水疱。"
      }
    ],
    specialtyAssessment: {
      bodyRegions: [
        { id: "face", active: true, affectedBsaPercent: 2.8, depigmentationPercent: 90, activity: "进展", note: "额部、口周、眉周" },
        { id: "headNeck", active: true, affectedBsaPercent: 2, depigmentationPercent: 75, activity: "进展", note: "颈部散在" }
      ],
      vasiHistory: [
        { id: "VASI-001", date: "2026-03-14", bsaPercent: 4.8, vasiScore: 4.02, regionCount: 2, recordedBy: "u-doctor-he", note: "初诊量化，作为基线。" },
        { id: "VASI-002", date: "2026-03-28", bsaPercent: 4.5, vasiScore: 3.68, regionCount: 2, recordedBy: "u-doctor-he", note: "边界较前稳定，继续观察。" }
      ],
      photoCompare: { beforePhotoId: "IMG-001", afterPhotoId: "IMG-001" },
      trendNote: "面部为重点观察部位，需结合照片和伍德灯复评。"
    },
    followUps: [
      {
        id: "F-001",
        date: "2026-03-18",
        life: "学生，近期作息偏晚。",
        dietSleep: "饮食无特殊，睡眠约23:00-24:00。",
        emotion: "担心面部白斑影响社交。",
        conditionChange: "暂无明显缩小，局部轻微泛红。",
        specialConcern: "家属希望先观察疗效，再决定后续疗程。",
        nextAction: "解释疗程周期，提醒按时复诊。"
      }
    ]
  },
  {
    id: "P20260406-002",
    nameAlias: "患者B",
    age: 31,
    gender: "男",
    tag: "稳定期-复诊",
    source: "老患者复诊",
    status: "观察随访",
    departmentId: "dept-follow",
    ownerUserId: "u-doctor-zhang",
    doctor: "张医生",
    contact: "",
    createdAt: "2026-04-06",
    medicalRecord: {
      recordNo: "MR-P20260406-002",
      emrStatus: "已提交",
      version: 1,
      signedBy: "",
      signedAt: "",
      submittedAt: "2026-04-06 11:20",
      archivedAt: "",
      revisionReason: "",
      aiSummaryConfirmedBy: "",
      aiSummaryConfirmedAt: "",
      chiefComplaint: "手背白斑复诊，近2个月未见明显扩大。",
      presentIllness: "规律治疗后白斑边缘较前模糊，患者对疗效认可，但因工作原因复诊不稳定。",
      pastHistory: "无特殊慢病史。",
      exam: "手背散在色素减退斑，伍德灯下荧光减弱，未见明显新发。",
      diagnosis: "白癜风，稳定期",
      plan: "维持治疗，建议每4周复诊，间隔期线上回访。",
      vitiligoAssessment: {
        onsetDate: "2025-12",
        diseaseType: "肢端型",
        stage: "稳定期",
        bodySites: "双手背",
        color: "淡白色",
        boundary: "边界较前模糊",
        surface: "表面光滑",
        woodLamp: "荧光较前减弱",
        areaPercent: "约2.2%",
        hairWhitening: "未见明显毛发变白",
        koebner: "否认新发外伤部位白斑",
        familyHistory: "无特殊",
        triggerFactors: "工作出差导致复诊不规律",
        previousTreatment: "规律外用药及局部光疗",
        lifestyleSleep: "睡眠不规律",
        comorbidity: "无特殊慢病史"
      },
      versions: []
    },
    imageTimeline: [
      {
        id: "IMG-002",
        date: "2026-04-06",
        bodySite: "双手背",
        mode: "普通光",
        aiAreaPercent: "2.2",
        doctorConfirmed: "待确认",
        note: "复诊对比：边界较前模糊。"
      }
    ],
    examReports: [
      {
        id: "E-002",
        date: "2026-04-06",
        type: "伍德灯检查",
        area: "双手背约6处",
        result: "荧光较前减弱，边界较前模糊。",
        photoNote: "脱敏演示记录。"
      }
    ],
    treatmentPlans: [
      {
        id: "T-002",
        date: "2026-04-06",
        medication: "维持外用药",
        phototherapy: "局部光疗，每周1-2次",
        dose: "220mJ/cm2",
        reaction: "无明显不适",
        course: "30天复评",
        nextVisit: "2026-05-06",
        notes: "关注工作时间冲突导致的中断风险。"
      }
    ],
    phototherapySessions: [
      {
        id: "PT-003",
        date: "2026-04-06",
        device: "局部窄谱UVB",
        bodySite: "双手背",
        doseMj: 220,
        durationSeconds: 12,
        erythema: "无明显不适",
        operatorUserId: "u-therapist",
        nextDosePlan: "维持剂量，复诊复核",
        note: "复诊维持治疗。"
      }
    ],
    specialtyAssessment: {
      bodyRegions: [
        { id: "hands", active: true, affectedBsaPercent: 2.2, depigmentationPercent: 50, activity: "稳定", note: "双手背色素减退斑" }
      ],
      vasiHistory: [
        { id: "VASI-003", date: "2026-04-06", bsaPercent: 2.2, vasiScore: 1.1, regionCount: 1, recordedBy: "u-doctor-zhang", note: "复诊量化。" }
      ],
      photoCompare: { beforePhotoId: "IMG-002", afterPhotoId: "IMG-002" },
      trendNote: "稳定期重点看边界、复色和复诊依从性。"
    },
    followUps: [
      {
        id: "F-002",
        date: "2026-04-20",
        life: "工作繁忙，经常出差。",
        dietSleep: "睡眠不规律。",
        emotion: "疗效认可，但担心时间成本。",
        conditionChange: "无新发，局部颜色略恢复。",
        specialConcern: "希望减少到院次数。",
        nextAction: "提供周末复诊方案并强调维持期价值。"
      }
    ]
  },
  {
    id: "P20260512-003",
    nameAlias: "患者C",
    age: 45,
    gender: "女",
    tag: "初诊-高关注",
    source: "线上咨询",
    status: "待决策",
    departmentId: "dept-consult",
    ownerUserId: "u-doctor-he",
    doctor: "李医生",
    contact: "",
    createdAt: "2026-05-12",
    medicalRecord: {
      recordNo: "MR-P20260512-003",
      emrStatus: "草稿",
      version: 1,
      signedBy: "",
      signedAt: "",
      submittedAt: "",
      archivedAt: "",
      revisionReason: "",
      aiSummaryConfirmedBy: "",
      aiSummaryConfirmedAt: "",
      chiefComplaint: "颈部与手臂白斑半年，近期咨询治疗方案。",
      presentIllness: "患者未系统治疗，担心费用和周期。家属建议先了解方案后再决定。",
      pastHistory: "有甲状腺功能异常病史，需联合评估。",
      exam: "颈部及上肢散在色素脱失斑，部分边界清楚。",
      diagnosis: "白癜风待分型，需完善检查",
      plan: "建议完善伍德灯及免疫相关检查后制定疗程。",
      vitiligoAssessment: {
        onsetDate: "2025-11",
        diseaseType: "待分型",
        stage: "待评估",
        bodySites: "颈部、上肢",
        color: "色素脱失斑",
        boundary: "部分边界清楚",
        surface: "待记录",
        woodLamp: "",
        areaPercent: "",
        hairWhitening: "未记录",
        koebner: "未记录",
        familyHistory: "待追问",
        triggerFactors: "待完善病因调查",
        previousTreatment: "未系统治疗",
        lifestyleSleep: "睡眠一般",
        comorbidity: "甲状腺功能异常病史"
      },
      versions: []
    },
    imageTimeline: [],
    examReports: [],
    treatmentPlans: [],
    followUps: [
      {
        id: "F-003",
        date: "2026-05-13",
        life: "家庭支持一般。",
        dietSleep: "饮食正常，睡眠一般。",
        emotion: "对治疗周期和费用顾虑较重。",
        conditionChange: "暂未开始系统治疗。",
        specialConcern: "希望看到类似案例和阶段目标。",
        nextAction: "发送检查必要性说明，预约复诊沟通。"
      }
    ]
  }
];

export const DEMO_REGISTRATIONS = [
  {
    id: "REG-001",
    queueNo: "A001",
    patientId: "P20260314-001",
    departmentId: "dept-initial",
    doctorUserId: "u-doctor-he",
    guideUserId: "u-guide",
    status: "已完成",
    createdAt: "2026-03-14",
    note: "初诊建档后进入医生工作站。"
  },
  {
    id: "REG-002",
    queueNo: "B006",
    patientId: "P20260406-002",
    departmentId: "dept-follow",
    doctorUserId: "u-doctor-zhang",
    guideUserId: "u-guide",
    status: "候诊中",
    createdAt: "2026-06-28",
    note: "复诊候诊。"
  }
];

export const DEMO_SERVICE_ORDERS = [
  {
    id: "SO-001",
    patientId: "P20260314-001",
    departmentId: "dept-light",
    doctorUserId: "u-doctor-he",
    itemName: "308光疗首期疗程",
    category: "光疗",
    amount: 1280,
    status: "已成交",
    executedCount: 3,
    totalCount: 10,
    createdAt: "2026-03-14",
    note: "项目销售用于经营统计，不绑定个人提成。"
  },
  {
    id: "SO-002",
    patientId: "P20260406-002",
    departmentId: "dept-light",
    doctorUserId: "u-doctor-zhang",
    itemName: "局部光疗复诊疗程",
    category: "光疗",
    amount: 860,
    status: "已成交",
    executedCount: 2,
    totalCount: 6,
    createdAt: "2026-04-06",
    note: "复诊维持疗程。"
  },
  {
    id: "SO-003",
    patientId: "P20260512-003",
    departmentId: "dept-exam",
    doctorUserId: "u-doctor-he",
    itemName: "伍德灯及面积评估",
    category: "检查",
    amount: 180,
    status: "已开单",
    executedCount: 0,
    totalCount: 1,
    createdAt: "2026-05-12",
    note: "待患者确认检查。"
  }
];

export const DEMO_PRESCRIPTIONS = [
  {
    id: "处方-001",
    patientId: "P20260314-001",
    departmentId: "dept-initial",
    doctorUserId: "u-doctor-he",
    date: "2026-03-14",
    drugName: "外用药物组合",
    usage: "按医嘱局部外用",
    course: "15天",
    estimatedAmount: 260,
    status: "已审核",
    reviewBy: "u-director",
    reviewNote: "演示处方，已通过合理性记录。",
    source: "医生手工记录"
  },
  {
    id: "处方-002",
    patientId: "P20260512-003",
    departmentId: "dept-consult",
    doctorUserId: "u-doctor-he",
    date: "2026-05-12",
    drugName: "待完善检查后开方",
    usage: "暂不发药",
    course: "待定",
    estimatedAmount: 0,
    status: "草稿",
    reviewBy: "",
    reviewNote: "智能系统不得自动生成处方，仅保留医生草稿。",
    source: "医生手工记录"
  }
];

export const DEMO_PAYMENTS = [
  { id: "PAY-001", orderId: "SO-001", amount: 1280, method: "院内收款", date: "2026-03-14" },
  { id: "PAY-002", orderId: "SO-002", amount: 860, method: "院内收款", date: "2026-04-06" }
];

export const DEMO_REFUNDS = [];

export const DEMO_AUDIT_LOGS = [
  {
    id: "AUD-001",
    time: "2026-03-14 09:12",
    actorId: "u-guide",
    action: "registration:create",
    targetType: "Registration",
    targetId: "REG-001",
    detail: "导医挂号到初诊科。"
  },
  {
    id: "AUD-002",
    time: "2026-03-14 09:38",
    actorId: "u-doctor-he",
    action: "prescription:create",
    targetType: "PrescriptionRecord",
    targetId: "处方-001",
    detail: "医生手工记录处方，等待审核。"
  },
  {
    id: "AUD-003",
    time: "2026-03-14 10:05",
    actorId: "u-director",
    action: "prescription:review",
    targetType: "PrescriptionRecord",
    targetId: "处方-001",
    detail: "处方审核通过。"
  }
];

export function createDefaultState() {
  return {
    patients: structuredClone(DEMO_PATIENTS),
    departments: structuredClone(DEMO_DEPARTMENTS),
    roles: structuredClone(DEFAULT_ROLES),
    users: structuredClone(DEMO_USERS),
    registrations: structuredClone(DEMO_REGISTRATIONS),
    serviceOrders: structuredClone(DEMO_SERVICE_ORDERS),
    prescriptionRecords: structuredClone(DEMO_PRESCRIPTIONS),
    paymentRecords: structuredClone(DEMO_PAYMENTS),
    refundRecords: structuredClone(DEMO_REFUNDS),
    auditLogs: structuredClone(DEMO_AUDIT_LOGS),
    authSchemaVersion: AUTH_SCHEMA_VERSION,
    currentUserId: "",
    sessionUserId: "",
    loginSelectedUserId: "u-guide",
    userPermissionDrafts: {},
    newUserDraft: createEmptyUserDraft(1),
    accountSearch: "",
    roleSearch: "",
    selectedRoleId: "guide",
    selectedPermissionUserId: "u-guide",
    showNewUserForm: false,
    crudModal: null,
    settingsSection: "users",
    settingsMenuOpen: true,
    drawerCollapsed: false,
    selectedId: DEMO_PATIENTS[0].id,
    module: "guide",
    activeTab: "ai",
    query: "",
    tagFilter: "",
    showPatientCreateForm: false,
    patientCreateDraft: createPatientCreateDraft(),
    queueFilter: "",
    dashboardFilters: { departmentId: "", doctorUserId: "" },
    registrationDraft: {
      nameAlias: "",
      contact: "",
      age: "30",
      gender: "未填",
      source: "导医台",
      departmentId: "dept-initial",
      doctorUserId: "u-doctor-he",
      note: ""
    }
  };
}

export function normalizeState(raw) {
  const defaults = createDefaultState();
  const state = { ...defaults, ...(raw || {}) };
  state.departments = state.departments?.length ? state.departments : defaults.departments;
  state.roles = normalizeRoles(state.roles?.length ? state.roles : defaults.roles);
  state.users = normalizeUsers(state.users?.length ? state.users : defaults.users, state.roles);
  state.patients = (state.patients || []).map((patient, index) => normalizePatient(patient, index + 1, state.users));
  state.registrations = state.registrations || [];
  state.serviceOrders = state.serviceOrders || [];
  state.prescriptionRecords = state.prescriptionRecords || [];
  state.paymentRecords = state.paymentRecords || [];
  state.refundRecords = state.refundRecords || [];
  state.auditLogs = state.auditLogs || [];
  state.authSchemaVersion ||= 1;
  if (state.authSchemaVersion !== AUTH_SCHEMA_VERSION) {
    state.sessionUserId = "";
    state.currentUserId = "";
    state.authSchemaVersion = AUTH_SCHEMA_VERSION;
  }
  state.sessionUserId = state.users.some((user) => user.id === state.sessionUserId && user.enabled) ? state.sessionUserId : "";
  state.currentUserId = state.sessionUserId;
  state.loginSelectedUserId = state.users.some((user) => user.id === state.loginSelectedUserId && user.enabled) ? state.loginSelectedUserId : state.users.find((user) => user.enabled)?.id || "";
  state.userPermissionDrafts ||= {};
  state.newUserDraft = normalizeUserDraft(state.newUserDraft || createEmptyUserDraft(state.users.length + 1));
  state.accountSearch ||= "";
  state.roleSearch ||= "";
  state.selectedRoleId = state.roles.some((role) => role.id === state.selectedRoleId) ? state.selectedRoleId : state.roles[0]?.id || "";
  state.selectedPermissionUserId = state.users.some((user) => user.id === state.selectedPermissionUserId) ? state.selectedPermissionUserId : state.users[0]?.id || "";
  state.showNewUserForm = state.showNewUserForm === true;
  state.crudModal = null;
  state.settingsSection = ["users", "roles", "departments", "rules"].includes(state.settingsSection) ? state.settingsSection : "users";
  state.settingsMenuOpen = state.settingsMenuOpen !== false;
  state.drawerCollapsed = state.drawerCollapsed === true;
  state.selectedId = state.patients.some((patient) => patient.id === state.selectedId) ? state.selectedId : state.patients[0]?.id;
  state.module ||= "guide";
  state.activeTab ||= "ai";
  state.query ||= "";
  state.tagFilter ||= "";
  state.showPatientCreateForm = state.showPatientCreateForm === true;
  state.patientCreateDraft = normalizePatientCreateDraft(state.patientCreateDraft || createPatientCreateDraft());
  state.queueFilter ||= "";
  state.dashboardFilters ||= { departmentId: "", doctorUserId: "" };
  state.registrationDraft ||= defaults.registrationDraft;
  return state;
}

export function createEmptyPatient(nextNumber = 1, overrides = {}) {
  const today = todayString();
  const owner = overrides.ownerUserId || "u-doctor-he";
  return normalizePatient({
    id: overrides.id || `P${today.replaceAll("-", "")}-${String(nextNumber).padStart(3, "0")}`,
    nameAlias: overrides.nameAlias || `患者${nextNumber}`,
    age: overrides.age ?? 30,
    gender: overrides.gender || "未填",
    tag: overrides.tag || "初诊-待评估",
    source: overrides.source || "导医台",
    status: overrides.status || "待评估",
    departmentId: overrides.departmentId || "dept-initial",
    ownerUserId: owner,
    doctor: overrides.doctor || "何医生",
    contact: overrides.contact || "",
    createdAt: overrides.createdAt || today,
    medicalRecord: {
      recordNo: `MR-${overrides.id || today.replaceAll("-", "")}-${String(nextNumber).padStart(3, "0")}`,
      emrStatus: "草稿",
      version: 1,
      signedBy: "",
      signedAt: "",
      submittedAt: "",
      archivedAt: "",
      revisionReason: "",
      aiSummaryConfirmedBy: "",
      aiSummaryConfirmedAt: "",
      chiefComplaint: "",
      presentIllness: "",
      pastHistory: "",
      exam: "",
      diagnosis: "",
      plan: "",
      vitiligoAssessment: structuredClone(VITILIGO_TEMPLATE_DEFAULTS),
      versions: []
    },
    imageTimeline: [],
    examReports: [],
    treatmentPlans: [],
    phototherapySessions: [],
    specialtyAssessment: createSpecialtyAssessment(),
    followUps: []
  }, nextNumber, DEMO_USERS);
}

export function makeBlankEntry(type) {
  const today = todayString();
  const id = `${type}-${Date.now().toString(36)}`;
  if (type === "E") {
    return { id, date: today, type: "伍德灯检查", area: "", result: "", photoNote: "不采集真实照片，仅记录脱敏说明。" };
  }
  if (type === "T") {
    return { id, date: today, medication: "", phototherapy: "", dose: "", reaction: "", course: "", nextVisit: "", notes: "" };
  }
  if (type === "IMG") {
    return { id, date: today, bodySite: "", mode: "普通光", aiAreaPercent: "", doctorConfirmed: "待确认", note: "" };
  }
  if (type === "PT") {
    return createPhototherapySession();
  }
  return { id, date: today, life: "", dietSleep: "", emotion: "", conditionChange: "", specialConcern: "", nextAction: "" };
}

export function createSpecialtyAssessment(overrides = {}) {
  return normalizeSpecialtyAssessment({
    bodyRegions: BODY_REGION_DEFINITIONS.map((region) => ({
      id: region.id,
      active: false,
      affectedBsaPercent: "",
      depigmentationPercent: 100,
      activity: "待评估",
      note: ""
    })),
    vasiHistory: [],
    photoCompare: { beforePhotoId: "", afterPhotoId: "" },
    trendNote: "",
    ...(overrides || {})
  });
}

export function createPhototherapySession(overrides = {}) {
  return {
    id: overrides.id || `PT-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    date: overrides.date || todayString(),
    device: overrides.device || "308准分子光",
    bodySite: overrides.bodySite || "",
    doseMj: overrides.doseMj ?? "",
    durationSeconds: overrides.durationSeconds ?? "",
    erythema: overrides.erythema || "未记录",
    operatorUserId: overrides.operatorUserId || "",
    nextDosePlan: overrides.nextDosePlan || "",
    note: overrides.note || ""
  };
}

export function createVasiSnapshot(patient, actorId = "") {
  const assessment = ensureSpecialtyAssessment(patient);
  const totals = calculateVasiFromRegions(assessment.bodyRegions);
  return {
    id: `VASI-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    date: todayString(),
    bsaPercent: formatMetric(totals.totalBsa),
    vasiScore: formatMetric(totals.totalVasi),
    regionCount: totals.activeCount,
    recordedBy: actorId,
    note: assessment.trendNote || "",
    regions: totals.rows.map((row) => ({
      id: row.id,
      label: row.label,
      affectedBsaPercent: formatMetric(row.affectedBsaPercent),
      depigmentationPercent: row.depigmentationPercent,
      vasiScore: formatMetric(row.vasiScore),
      activity: row.activity,
      note: row.note
    }))
  };
}

export function createImageUploadEntry({ fileName = "", dataUrl = "", bodySite = "", mode = "普通光", note = "", uploadedBy = "" } = {}) {
  const today = todayString();
  const now = new Date().toISOString().slice(0, 16).replace("T", " ");
  return {
    id: `IMG-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    date: today,
    bodySite,
    mode: ["普通光", "伍德灯"].includes(mode) ? mode : "普通光",
    aiAreaPercent: "",
    doctorConfirmed: "待确认",
    note: note || (fileName ? `病历上传：${fileName}` : "病历照片上传"),
    fileName,
    imageDataUrl: dataUrl,
    uploadedAt: now,
    uploadedBy,
    source: "病历上传"
  };
}

export function createRegistration({ patientId, departmentId, doctorUserId, guideUserId, note = "" }, count = 0) {
  const today = todayString();
  return {
    id: `REG-${Date.now().toString(36)}`,
    queueNo: `${queuePrefix(departmentId)}${String(count + 1).padStart(3, "0")}`,
    patientId,
    departmentId,
    doctorUserId,
    guideUserId,
    status: "候诊中",
    createdAt: today,
    note
  };
}

export function createServiceOrder({ patientId, departmentId, doctorUserId }) {
  return {
    id: `SO-${Date.now().toString(36)}`,
    patientId,
    departmentId,
    doctorUserId,
    itemName: "308光疗疗程",
    category: "光疗",
    amount: 0,
    status: "已开单",
    executedCount: 0,
    totalCount: 1,
    createdAt: todayString(),
    note: "项目/疗程记录用于经营统计与执行追踪，不作为个人提成依据。"
  };
}

export function createPrescriptionRecord({ patientId, departmentId, doctorUserId }) {
  return {
    id: `处方-${Date.now()}`,
    patientId,
    departmentId,
    doctorUserId,
    date: todayString(),
    drugName: "",
    usage: "",
    course: "",
    estimatedAmount: 0,
    status: "草稿",
    reviewBy: "",
    reviewNote: "智能系统不得自动生成处方；本记录需由医生手工填写并提交审核。",
    source: "医生手工记录"
  };
}

export function createPaymentRecord(order) {
  return {
    id: `PAY-${Date.now().toString(36)}`,
    orderId: order.id,
    amount: Number(order.amount) || 0,
    method: "院内收款",
    date: todayString()
  };
}

export function createRefundRecord(order) {
  return {
    id: `REF-${Date.now().toString(36)}`,
    orderId: order.id,
    amount: Number(order.amount) || 0,
    reason: "演示退款记录",
    date: todayString()
  };
}

export function createDepartment(nextNumber = 1) {
  return {
    id: `dept-custom-${Date.now().toString(36)}`,
    name: `新科室${nextNumber}`,
    type: "临床",
    enabled: true
  };
}

export function createEmptyUserDraft(nextNumber = 1) {
  return {
    loginName: `账号${String(nextNumber).padStart(3, "0")}`,
    name: `新账号${nextNumber}`,
    role: "guide",
    departmentIds: ["dept-initial"],
    moduleAccess: defaultModuleAccess("guide"),
    enabled: true
  };
}

export function createPatientCreateDraft(overrides = {}) {
  return {
    nameAlias: overrides.nameAlias || "",
    age: overrides.age || "30",
    gender: overrides.gender || "未填",
    source: overrides.source || "门诊建档",
    contact: overrides.contact || "",
    tag: overrides.tag || "初诊-待评估",
    departmentId: overrides.departmentId || "dept-initial",
    ownerUserId: overrides.ownerUserId || "u-doctor-he"
  };
}

export function createAuditLog(actorId, action, targetType, targetId, detail = "") {
  return {
    id: `AUD-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    time: formatDateTime(new Date()),
    actorId,
    action,
    targetType,
    targetId,
    detail
  };
}

export function getRecordQuality(patient) {
  const record = patient?.medicalRecord || {};
  const vitiligo = record.vitiligoAssessment || {};
  const latestTreatment = getLatestByDate(patient?.treatmentPlans || []);
  const specialty = calculateSpecialtyMetrics(patient);
  const checks = [
    { label: "主诉", value: record.chiefComplaint },
    { label: "现病史", value: record.presentIllness },
    { label: "专科/辅助检查", value: record.exam },
    { label: "诊断", value: record.diagnosis },
    { label: "处理意见", value: record.plan },
    { label: "白斑部位", value: vitiligo.bodySites },
    { label: "病情分期", value: vitiligo.stage && vitiligo.stage !== "待评估" ? vitiligo.stage : "" },
    { label: "伍德灯表现", value: vitiligo.woodLamp || record.exam },
    { label: "面积估算", value: vitiligo.areaPercent || (specialty.currentBsa ? `${specialty.currentBsa}%` : "") },
    { label: "下次复诊", value: latestTreatment?.nextVisit }
  ];
  const missing = checks.filter((item) => !String(item.value || "").trim()).map((item) => item.label);
  const warnings = [];
  if (!record.signedBy) warnings.push("病历尚未医生签名");
  if (!record.aiSummaryConfirmedBy) warnings.push("智能摘要/风险分析尚未医生确认");
  if (!patient?.examReports?.length) warnings.push("缺少检查报告记录");
  if (!patient?.imageTimeline?.length) warnings.push("缺少照片时间轴记录");
  if (!specialty.currentBsa && !specialty.currentVasi) warnings.push("缺少面积和白斑评分专科量化记录");
  const score = Math.max(0, Math.round(((checks.length - missing.length) / checks.length) * 100));
  const status = missing.length === 0 ? "合格" : missing.length <= 3 ? "待完善" : "严重缺项";
  return { score, status, missing, warnings, checkedCount: checks.length };
}

export function calculateVasiFromRegions(regions = []) {
  const rows = (regions || []).map((item) => {
    const definition = BODY_REGION_DEFINITIONS.find((region) => region.id === item.id) || {};
    const affectedBsaPercent = clampNumber(item.affectedBsaPercent, 0, 100);
    const depigmentationPercent = clampNumber(item.depigmentationPercent || 100, 0, 100);
    const active = item.active === true || affectedBsaPercent > 0;
    const vasiScore = active ? affectedBsaPercent * (depigmentationPercent / 100) : 0;
    return {
      id: item.id,
      label: definition.label || item.label || item.id,
      short: definition.short || "",
      group: definition.group || "",
      hint: definition.hint || "",
      active,
      affectedBsaPercent,
      depigmentationPercent,
      vasiScore,
      activity: item.activity || "待评估",
      note: item.note || ""
    };
  });
  const activeRows = rows.filter((row) => row.active || row.note);
  const totalBsa = activeRows.reduce((sum, row) => sum + row.affectedBsaPercent, 0);
  const totalVasi = activeRows.reduce((sum, row) => sum + row.vasiScore, 0);
  return {
    rows,
    activeRows,
    activeCount: activeRows.filter((row) => row.active).length,
    totalBsa: formatMetric(totalBsa),
    totalVasi: formatMetric(totalVasi)
  };
}

export function calculateSpecialtyMetrics(patient) {
  const assessment = patient?.specialtyAssessment || createSpecialtyAssessment();
  const current = calculateVasiFromRegions(assessment.bodyRegions || []);
  const history = (assessment.vasiHistory || [])
    .slice()
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));
  const baseline = history[0] || null;
  const latestSaved = history.at(-1) || null;
  const sessions = patient?.phototherapySessions || [];
  const latestSession = sessions.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0] || null;
  const photoAreas = (patient?.imageTimeline || [])
    .map((photo) => ({ date: photo.date || "", value: clampNumber(photo.aiAreaPercent, 0, 100), label: photo.bodySite || photo.mode || "照片" }))
    .filter((item) => item.value > 0)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const baselineVasi = baseline ? clampNumber(baseline.vasiScore, 0, 100) : current.totalVasi;
  const latestVasi = latestSaved ? clampNumber(latestSaved.vasiScore, 0, 100) : current.totalVasi;
  return {
    currentBsa: current.totalBsa,
    currentVasi: current.totalVasi,
    activeRegionCount: current.activeCount,
    currentRows: current.activeRows,
    history,
    baselineVasi,
    latestVasi,
    vasiChange: formatMetric(latestVasi - baselineVasi),
    vasiChangePercent: baselineVasi ? formatMetric(((latestVasi - baselineVasi) / baselineVasi) * 100) : 0,
    phototherapyCount: sessions.length,
    latestDose: latestSession?.doseMj || "",
    latestSession,
    photoAreas
  };
}

export function createMedicalRecordVersion(patient, actorId, action, note = "") {
  const record = patient.medicalRecord || {};
  const versions = record.versions || [];
  return {
    id: `MRV-${Date.now().toString(36)}-${versions.length + 1}`,
    version: record.version || versions.length + 1,
    action,
    actorId,
    time: formatDateTime(new Date()),
    note,
    status: record.emrStatus || "草稿",
    snapshot: {
      chiefComplaint: record.chiefComplaint || "",
      presentIllness: record.presentIllness || "",
      pastHistory: record.pastHistory || "",
      exam: record.exam || "",
      diagnosis: record.diagnosis || "",
      plan: record.plan || "",
      vitiligoAssessment: structuredClone(record.vitiligoAssessment || VITILIGO_TEMPLATE_DEFAULTS),
      specialtyAssessment: structuredClone(patient.specialtyAssessment || createSpecialtyAssessment()),
      phototherapySessions: structuredClone(patient.phototherapySessions || []),
      signedBy: record.signedBy || "",
      signedAt: record.signedAt || "",
      submittedAt: record.submittedAt || "",
      archivedAt: record.archivedAt || ""
    }
  };
}

export function applyMedicalRecordAction(patient, actorId, action, note = "") {
  const record = ensureMedicalRecord(patient);
  record.versions ||= [];
  record.versions.unshift(createMedicalRecordVersion(patient, actorId, action, note));
  const now = formatDateTime(new Date());
  if (action === "submit") {
    record.emrStatus = "已提交";
    record.submittedAt = now;
  }
  if (action === "sign") {
    record.emrStatus = "已签名";
    record.signedBy = actorId;
    record.signedAt = now;
  }
  if (action === "archive") {
    record.emrStatus = "已归档";
    record.archivedAt = now;
  }
  if (action === "revise") {
    record.emrStatus = "修订中";
    record.version = Number(record.version || 1) + 1;
    record.revisionReason = note;
    record.signedBy = "";
    record.signedAt = "";
    record.archivedAt = "";
  }
  if (action === "ai-confirm") {
    record.aiSummaryConfirmedBy = actorId;
    record.aiSummaryConfirmedAt = now;
  }
  return record;
}

export function formatMedicalRecordText(patient, state = {}) {
  const record = ensureMedicalRecord(patient);
  const vitiligo = record.vitiligoAssessment || VITILIGO_TEMPLATE_DEFAULTS;
  const specialty = calculateSpecialtyMetrics(patient);
  const quality = getRecordQuality(patient);
  const doctorName = state.users?.find((user) => user.id === patient.ownerUserId)?.name || patient.doctor || patient.ownerUserId || "未分配";
  const departmentName = state.departments?.find((department) => department.id === patient.departmentId)?.name || patient.departmentId || "未分配";
  const signedName = state.users?.find((user) => user.id === record.signedBy)?.name || record.signedBy || "未签名";
  return [
    "白癜风门诊电子病历",
    `病历号：${record.recordNo || patient.id}`,
    `患者：${patient.nameAlias || patient.id}　性别：${patient.gender || "未填"}　年龄：${patient.age || "未填"}`,
    `科室：${departmentName}　医生：${doctorName}　建档日期：${patient.createdAt || ""}`,
    `状态：${record.emrStatus || "草稿"}　版本：V${record.version || 1}　质控：${quality.status}(${quality.score}分)`,
    "",
    "一、主诉",
    record.chiefComplaint || "未记录",
    "",
    "二、现病史",
    record.presentIllness || "未记录",
    "",
    "三、既往史",
    record.pastHistory || "未记录",
    "",
    "四、白癜风专病评估",
    `发病时间：${vitiligo.onsetDate || "未记录"}`,
    `分型/分期：${vitiligo.diseaseType || "未记录"} / ${vitiligo.stage || "未记录"}`,
    `白斑部位：${vitiligo.bodySites || "未记录"}`,
    `颜色/边界/表面：${vitiligo.color || "未记录"} / ${vitiligo.boundary || "未记录"} / ${vitiligo.surface || "未记录"}`,
    `伍德灯：${vitiligo.woodLamp || "未记录"}`,
    `面积估算：${vitiligo.areaPercent || "未记录"}`,
    `量化评估：体表面积 ${specialty.currentBsa || 0}%　白斑评分 ${specialty.currentVasi || 0}　受累部位 ${specialty.activeRegionCount || 0} 个`,
    `主要部位：${specialty.currentRows.length ? specialty.currentRows.map((row) => `${row.label}${row.affectedBsaPercent}%/脱色${row.depigmentationPercent}%`).join("；") : "未记录"}`,
    `光疗剂量：${specialty.latestSession ? `${specialty.latestSession.date} ${specialty.latestSession.bodySite || "未填部位"} ${specialty.latestSession.doseMj || "未填"}mJ/cm2，反应：${specialty.latestSession.erythema || "未记录"}` : "未记录"}`,
    `毛发变白：${vitiligo.hairWhitening || "未记录"}　同形反应：${vitiligo.koebner || "未记录"}`,
    `家族史：${vitiligo.familyHistory || "未记录"}`,
    `诱发因素：${vitiligo.triggerFactors || "未记录"}`,
    `既往治疗：${vitiligo.previousTreatment || "未记录"}`,
    `生活/睡眠：${vitiligo.lifestyleSleep || "未记录"}`,
    `共病情况：${vitiligo.comorbidity || "未记录"}`,
    "",
    "五、专科/辅助检查",
    record.exam || "未记录",
    "",
    "六、诊断",
    record.diagnosis || "未记录",
    "",
    "七、处理意见",
    record.plan || "未记录",
    "",
    `医生签名：${signedName}　签名时间：${record.signedAt || "未签名"}`,
    `归档时间：${record.archivedAt || "未归档"}`
  ].join("\n");
}

export function can(user, permission) {
  if (!user) return false;
  const permissions = user.permissions || ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes("*") || permissions.includes(permission);
}

export function canAccessDepartment(user, departmentId) {
  if (!user) return false;
  if (can(user, "cross_department:view")) return true;
  return !departmentId || (user.departmentIds || []).includes(departmentId);
}

export function canAccessPatient(user, patient, mode = "basic") {
  if (!user || !patient) return false;
  if (can(user, "cross_department:view")) return true;
  if (mode === "record" && !can(user, "record:read") && !can(user, "record:write")) return false;
  if (user.role === "guide") return mode === "basic";
  if (user.role === "doctor") return patient.ownerUserId === user.id || canAccessDepartment(user, patient.departmentId);
  if (user.role === "therapist") return mode !== "record" && canAccessDepartment(user, "dept-light");
  if (user.role === "followup") return mode !== "record" && (canAccessDepartment(user, patient.departmentId) || canAccessDepartment(user, "dept-callback"));
  return canAccessDepartment(user, patient.departmentId);
}

export function getVisiblePatients(state, user) {
  return state.patients.filter((patient) => canAccessPatient(user, patient, "basic"));
}

export function summarizeDirector(state, filters = {}) {
  const orders = state.serviceOrders.filter((order) => matchesFilters(order, filters));
  const prescriptions = state.prescriptionRecords.filter((record) => matchesFilters(record, filters));
  const payments = state.paymentRecords.filter((payment) => {
    const order = state.serviceOrders.find((item) => item.id === payment.orderId);
    return order && matchesFilters(order, filters);
  });
  const refunds = state.refundRecords.filter((refund) => {
    const order = state.serviceOrders.find((item) => item.id === refund.orderId);
    return order && matchesFilters(order, filters);
  });
  const gross = sum(payments, "amount");
  const refundAmount = sum(refunds, "amount");
  const net = gross - refundAmount;
  const prescriptionStatus = countBy(prescriptions, "status");
  const departmentRows = state.departments.map((department) => summarizeGroup(state, "departmentId", department.id, department.name, filters));
  const doctorRows = state.users
    .filter((user) => user.role === "doctor")
    .map((doctor) => summarizeGroup(state, "doctorUserId", doctor.id, doctor.name, filters));

  return {
    totals: {
      gross,
      refundAmount,
      net,
      orderCount: orders.length,
      prescriptionCount: prescriptions.length,
      pendingPrescriptionCount: (prescriptionStatus["待审核"] || 0) + (prescriptionStatus["草稿"] || 0),
      executedTreatmentCount: sum(orders, "executedCount")
    },
    prescriptionStatus,
    departmentRows,
    doctorRows,
    anomalies: buildAnomalies(state, orders, prescriptions, refunds)
  };
}

export function assessPatient(patient, now = new Date()) {
  const latestTreatment = getLatestByDate(patient.treatmentPlans);
  const latestFollowUp = getLatestByDate(patient.followUps);
  const hasExam = patient.examReports.length > 0;
  const hasTreatment = patient.treatmentPlans.length > 0;
  const combinedText = [
    patient.tag,
    patient.status,
    patient.medicalRecord?.chiefComplaint,
    patient.medicalRecord?.presentIllness,
    patient.medicalRecord?.diagnosis,
    latestFollowUp?.emotion,
    latestFollowUp?.specialConcern,
    latestFollowUp?.conditionChange,
    latestFollowUp?.nextAction,
    latestTreatment?.notes
  ].filter(Boolean).join(" ");

  const factors = [];
  let riskScore = 18;

  if (/进展|扩大|新发|泛红|不稳定/.test(combinedText)) {
    riskScore += 18;
    factors.push({ label: "病情波动", score: 18, note: "记录中出现进展、扩大、新发或刺激反应，需要更紧密沟通。" });
  } else {
    factors.push({ label: "病情稳定", score: -6, note: "未见明显进展描述，基础流失风险下降。" });
    riskScore -= 6;
  }

  if (/费用|价格|周期|时间|出差|减少到院|顾虑|先观察/.test(combinedText)) {
    riskScore += 20;
    factors.push({ label: "决策阻力", score: 20, note: "存在费用、时间、周期或家属决策顾虑。" });
  }

  if (/担心|焦虑|影响|社交|家属/.test(combinedText)) {
    riskScore += 12;
    factors.push({ label: "情绪关注", score: 12, note: "患者或家属存在明显担忧，适合用阶段目标降低不确定感。" });
  }

  if (!hasExam) {
    riskScore += 14;
    factors.push({ label: "检查缺口", score: 14, note: "缺少检查报告，诊疗依据与方案说服力不足。" });
  }

  if (!hasTreatment) {
    riskScore += 18;
    factors.push({ label: "尚未启动疗程", score: 18, note: "未形成治疗计划，容易停留在咨询阶段。" });
  } else {
    riskScore -= 10;
    factors.push({ label: "已有治疗计划", score: -10, note: "已记录疗程和治疗方式，成交与复诊基础更明确。" });
  }

  const daysToNextVisit = latestTreatment?.nextVisit ? dateDiffInDays(now, latestTreatment.nextVisit) : null;
  if (daysToNextVisit !== null) {
    if (daysToNextVisit < -7) {
      riskScore += 18;
      factors.push({ label: "复诊逾期", score: 18, note: `计划复诊已逾期 ${Math.abs(daysToNextVisit)} 天。` });
    } else if (daysToNextVisit <= 7) {
      riskScore -= 6;
      factors.push({ label: "近期复诊", score: -6, note: "复诊窗口临近，适合主动提醒与确认时间。" });
    }
  } else {
    riskScore += 8;
    factors.push({ label: "复诊未设定", score: 8, note: "缺少下一次复诊日期，跟进节奏不够明确。" });
  }

  const daysSinceFollowUp = latestFollowUp?.date ? Math.max(0, -dateDiffInDays(now, latestFollowUp.date)) : null;
  if (daysSinceFollowUp === null || daysSinceFollowUp > 14) {
    riskScore += 12;
    factors.push({ label: "回访间隔偏长", score: 12, note: "最近回访超过两周或未记录回访。" });
  } else {
    riskScore -= 8;
    factors.push({ label: "近期有回访", score: -8, note: "已有近期回访记录，有利于维持信任。" });
  }

  riskScore = clamp(Math.round(riskScore), 5, 95);
  const conversionRate = clamp(Math.round(100 - riskScore + (hasTreatment ? 8 : 0) + (hasExam ? 5 : 0)), 5, 96);
  const riskLevel = riskScore >= 70 ? "高风险" : riskScore >= 45 ? "中风险" : "低风险";

  const actionItems = buildActionItems({ patient, riskScore, conversionRate, hasExam, hasTreatment, daysToNextVisit, latestFollowUp });
  const script = buildTalkScript({ patient, riskLevel, conversionRate, latestTreatment, latestFollowUp });

  return {
    riskScore,
    riskLevel,
    conversionRate,
    factors,
    actionItems,
    talkScript: script,
    nextFollowUp: suggestFollowUpDate(now, riskScore),
    summary: makePatientSummary(patient)
  };
}

export function makePatientSummary(patient) {
  const diagnosis = patient.medicalRecord?.diagnosis || "诊断待完善";
  const chief = patient.medicalRecord?.chiefComplaint || "主诉待补充";
  const latestPlan = getLatestByDate(patient.treatmentPlans);
  const latestFollowUp = getLatestByDate(patient.followUps);
  return [
    `${patient.nameAlias || patient.id}，${patient.age || "年龄未填"}岁，${patient.gender || "性别未填"}。`,
    `当前标签：${patient.tag || "未分组"}；诊断：${diagnosis}。`,
    `主诉：${chief}`,
    latestPlan ? `治疗计划：${latestPlan.course || "疗程待补充"}，下次复诊 ${latestPlan.nextVisit || "未设定"}。` : "尚未建立治疗计划。",
    latestFollowUp ? `最近回访：${latestFollowUp.conditionChange || "病情变化待补充"}；关注点：${latestFollowUp.specialConcern || "未记录"}。` : "尚无回访记录。"
  ].join("\n");
}

export function mergeImportedRows(currentPatients, rows) {
  const patients = [...currentPatients];
  rows.forEach((row, index) => {
    const id = row.id || row.匿名编号 || row.patientId || `导入-${Date.now()}-${index + 1}`;
    const existingIndex = patients.findIndex((item) => item.id === id);
    const base = existingIndex >= 0 ? patients[existingIndex] : createEmptyPatient(patients.length + 1);
    const imported = normalizePatient({
      ...base,
      id,
      nameAlias: row.nameAlias || row.别名 || row.患者 || base.nameAlias,
      age: toNumber(row.age || row.年龄, base.age),
      gender: row.gender || row.性别 || base.gender,
      tag: row.tag || row.标签 || base.tag,
      source: row.source || row.来源 || base.source,
      status: row.status || row.状态 || base.status,
      departmentId: row.departmentId || row.科室ID || base.departmentId,
      ownerUserId: row.ownerUserId || row.医生ID || base.ownerUserId,
      doctor: row.doctor || row.医生 || base.doctor,
      contact: row.contact || row.联系方式 || "",
      createdAt: row.createdAt || row.建档日期 || base.createdAt,
      medicalRecord: {
        ...base.medicalRecord,
        chiefComplaint: row.chiefComplaint || row.主诉 || base.medicalRecord.chiefComplaint,
        presentIllness: row.presentIllness || row.现病史 || base.medicalRecord.presentIllness,
        exam: row.exam || row.检查 || base.medicalRecord.exam,
        diagnosis: row.diagnosis || row.诊断 || base.medicalRecord.diagnosis,
        plan: row.plan || row.处理意见 || base.medicalRecord.plan
      }
    }, patients.length + 1, DEMO_USERS);
    if (row.treatment || row.治疗方案 || row.nextVisit || row.下次复诊) {
      imported.treatmentPlans = [
        ...base.treatmentPlans,
        {
          id: `T-${Date.now().toString(36)}-${index}`,
          date: row.treatmentDate || row.治疗日期 || imported.createdAt,
          medication: row.treatment || row.治疗方案 || "",
          phototherapy: row.phototherapy || row.光疗 || "",
          dose: row.dose || row.剂量 || "",
          reaction: row.reaction || row.反应 || "",
          course: row.course || row.疗程 || "",
          nextVisit: row.nextVisit || row.下次复诊 || "",
          notes: row.notes || row.备注 || ""
        }
      ];
    }
    if (row.followUp || row.回访 || row.concern || row.关注点) {
      imported.followUps = [
        ...base.followUps,
        {
          id: `F-${Date.now().toString(36)}-${index}`,
          date: row.followUpDate || row.回访日期 || imported.createdAt,
          life: row.life || row.生活情况 || "",
          dietSleep: row.dietSleep || row.饮食睡眠 || "",
          emotion: row.emotion || row.情绪 || "",
          conditionChange: row.followUp || row.回访 || "",
          specialConcern: row.concern || row.关注点 || "",
          nextAction: row.nextAction || row.下一步 || ""
        }
      ];
    }
    if (existingIndex >= 0) {
      patients[existingIndex] = imported;
    } else {
      patients.push(imported);
    }
  });
  return patients;
}

function normalizePatient(patient, index, users) {
  const owner = patient.ownerUserId || userIdByDoctorName(users, patient.doctor) || "u-doctor-he";
  const id = patient.id || `P${todayString().replaceAll("-", "")}-${String(index).padStart(3, "0")}`;
  return {
    ...patient,
    departmentId: patient.departmentId || "dept-initial",
    ownerUserId: owner,
    doctor: patient.doctor || userNameById(users, owner) || "未分配",
    medicalRecord: normalizeMedicalRecord(patient.medicalRecord, id),
    specialtyAssessment: normalizeSpecialtyAssessment(patient.specialtyAssessment),
    imageTimeline: patient.imageTimeline || [],
    examReports: patient.examReports || [],
    treatmentPlans: patient.treatmentPlans || [],
    phototherapySessions: (patient.phototherapySessions || []).map((session) => createPhototherapySession(session)),
    followUps: patient.followUps || [],
    id
  };
}

function normalizeRoles(roles) {
  const seen = new Set();
  return roles
    .map((role) => {
      const id = String(role.id || "").trim();
      if (!id || seen.has(id)) return null;
      seen.add(id);
      const fallback = DEFAULT_ROLES.find((item) => item.id === id);
      const rawPermissions = role.permissions?.length ? [...role.permissions] : [...(fallback?.permissions || ["patient:list", "patient:basic"])];
      const rawModules = role.moduleAccess?.length ? [...role.moduleAccess] : [...(fallback?.moduleAccess || ["patients"])];
      return {
        id,
        name: String(role.name || fallback?.name || id).trim(),
        permissions: fallback?.builtIn ? [...new Set([...(fallback.permissions || []), ...rawPermissions])] : rawPermissions,
        moduleAccess: fallback?.builtIn ? [...new Set([...(fallback.moduleAccess || []), ...rawModules])] : rawModules,
        builtIn: role.builtIn === true || fallback?.builtIn === true
      };
    })
    .filter(Boolean);
}

function normalizeUsers(users, roles = DEFAULT_ROLES) {
  return users.map((user) => ({
    ...user,
    loginName: user.loginName || defaultLoginName(user),
    departmentIds: user.departmentIds || [],
    moduleAccess: user.moduleAccess?.length ? user.moduleAccess : defaultModuleAccess(user.role, roles),
    permissions: [...(roles.find((role) => role.id === user.role)?.permissions || ROLE_PERMISSIONS[user.role] || [])],
    roleName: roles.find((role) => role.id === user.role)?.name || ROLE_LABELS[user.role] || user.role,
    enabled: user.enabled !== false
  }));
}

function normalizeUserDraft(draft) {
  const role = draft.role || "guide";
  return {
    loginName: draft.loginName || "账号001",
    name: draft.name || "新账号",
    role,
    departmentIds: draft.departmentIds?.length ? draft.departmentIds : ["dept-initial"],
    moduleAccess: draft.moduleAccess?.length ? draft.moduleAccess : defaultModuleAccess(role),
    enabled: draft.enabled !== false
  };
}

function normalizePatientCreateDraft(draft) {
  return createPatientCreateDraft({
    nameAlias: draft.nameAlias || "",
    age: draft.age || "30",
    gender: draft.gender || "未填",
    source: draft.source || "门诊建档",
    contact: draft.contact || "",
    tag: draft.tag || "初诊-待评估",
    departmentId: draft.departmentId || "dept-initial",
    ownerUserId: draft.ownerUserId || "u-doctor-he"
  });
}

function defaultLoginName(user) {
  const prefix = {
    guide: "导医",
    doctor: "医生",
    therapist: "治疗师",
    followup: "回访",
    director: "院长",
    admin: "管理员"
  }[user.role] || "账号";
  return `${prefix}${String(Math.abs(hashText(user.id || user.name || prefix)) % 999 + 1).padStart(3, "0")}`;
}

function hashText(text) {
  return String(text).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function defaultModuleAccess(role, roles = DEFAULT_ROLES) {
  const roleConfig = roles.find((item) => item.id === role) || DEFAULT_ROLES.find((item) => item.id === role);
  if (roleConfig?.moduleAccess?.length) return [...roleConfig.moduleAccess];
  return ["patients"];
}

function normalizeMedicalRecord(record = {}, patientId = "") {
  return {
    recordNo: record.recordNo || `MR-${patientId || todayString().replaceAll("-", "")}`,
    emrStatus: EMR_STATUS.includes(record.emrStatus) ? record.emrStatus : "草稿",
    version: Number(record.version) || 1,
    signedBy: record.signedBy || "",
    signedAt: record.signedAt || "",
    submittedAt: record.submittedAt || "",
    archivedAt: record.archivedAt || "",
    revisionReason: record.revisionReason || "",
    aiSummaryConfirmedBy: record.aiSummaryConfirmedBy || "",
    aiSummaryConfirmedAt: record.aiSummaryConfirmedAt || "",
    chiefComplaint: record.chiefComplaint || "",
    presentIllness: record.presentIllness || "",
    pastHistory: record.pastHistory || "",
    exam: record.exam || "",
    diagnosis: record.diagnosis || "",
    plan: record.plan || "",
    vitiligoAssessment: {
      ...structuredClone(VITILIGO_TEMPLATE_DEFAULTS),
      ...(record.vitiligoAssessment || {})
    },
    versions: record.versions || []
  };
}

function normalizeSpecialtyAssessment(assessment = {}) {
  const regionsById = new Map((assessment.bodyRegions || []).map((region) => [region.id, region]));
  return {
    bodyRegions: BODY_REGION_DEFINITIONS.map((definition) => {
      const region = regionsById.get(definition.id) || {};
      const affectedBsaPercent = region.affectedBsaPercent ?? "";
      return {
        id: definition.id,
        active: region.active === true || clampNumber(affectedBsaPercent, 0, 100) > 0,
        affectedBsaPercent,
        depigmentationPercent: VASI_DEPIGMENTATION_OPTIONS.includes(Number(region.depigmentationPercent))
          ? Number(region.depigmentationPercent)
          : 100,
        activity: region.activity || "待评估",
        note: region.note || ""
      };
    }),
    vasiHistory: (assessment.vasiHistory || []).map((snapshot) => ({
      id: snapshot.id || `VASI-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      date: snapshot.date || todayString(),
      bsaPercent: snapshot.bsaPercent ?? "",
      vasiScore: snapshot.vasiScore ?? "",
      regionCount: Number(snapshot.regionCount) || 0,
      recordedBy: snapshot.recordedBy || "",
      note: snapshot.note || "",
      regions: snapshot.regions || []
    })),
    photoCompare: {
      beforePhotoId: assessment.photoCompare?.beforePhotoId || "",
      afterPhotoId: assessment.photoCompare?.afterPhotoId || ""
    },
    trendNote: assessment.trendNote || ""
  };
}

function ensureMedicalRecord(patient) {
  patient.medicalRecord = normalizeMedicalRecord(patient.medicalRecord, patient.id);
  return patient.medicalRecord;
}

function ensureSpecialtyAssessment(patient) {
  patient.specialtyAssessment = normalizeSpecialtyAssessment(patient.specialtyAssessment);
  patient.phototherapySessions = (patient.phototherapySessions || []).map((session) => createPhototherapySession(session));
  return patient.specialtyAssessment;
}

function summarizeGroup(state, key, value, label, filters) {
  const localFilters = { ...filters, [key]: value };
  const orders = state.serviceOrders.filter((order) => matchesFilters(order, localFilters));
  const payments = state.paymentRecords.filter((payment) => orders.some((order) => order.id === payment.orderId));
  const refunds = state.refundRecords.filter((refund) => orders.some((order) => order.id === refund.orderId));
  const prescriptions = state.prescriptionRecords.filter((record) => matchesFilters(record, localFilters));
  return {
    id: value,
    label,
    gross: sum(payments, "amount"),
    refundAmount: sum(refunds, "amount"),
    net: sum(payments, "amount") - sum(refunds, "amount"),
    orderCount: orders.length,
    prescriptionCount: prescriptions.length,
    pendingPrescriptionCount: prescriptions.filter((item) => ["草稿", "待审核", "退回"].includes(item.status)).length,
    executedTreatmentCount: sum(orders, "executedCount")
  };
}

function buildAnomalies(state, orders, prescriptions, refunds) {
  const anomalies = [];
  orders.forEach((order) => {
    if (Number(order.amount) >= 3000) {
      anomalies.push({
        level: "高",
        title: "高金额项目",
        detail: `${patientName(state, order.patientId)} 的 ${order.itemName} 金额为 ${order.amount} 元，建议复核知情沟通记录。`
      });
    }
    if (order.status === "已成交" && Number(order.executedCount) === 0) {
      anomalies.push({
        level: "中",
        title: "已成交未执行",
        detail: `${patientName(state, order.patientId)} 的 ${order.itemName} 已成交但执行次数为 0。`
      });
    }
  });
  prescriptions.forEach((record) => {
    if (["草稿", "待审核", "退回"].includes(record.status)) {
      anomalies.push({
        level: record.status === "退回" ? "高" : "中",
        title: "处方待处理",
        detail: `${patientName(state, record.patientId)} 的${record.drugName ? `处方“${record.drugName}”` : "处方记录"}状态为 ${record.status}。`
      });
    }
    if (/AI|自动/.test(record.source || "") && record.status !== "草稿") {
      anomalies.push({
        level: "高",
        title: "处方来源异常",
        detail: "处方来源标记为智能或自动，系统要求处方只能由医生手工确认。"
      });
    }
  });
  refunds.forEach((refund) => {
    const order = state.serviceOrders.find((item) => item.id === refund.orderId);
    anomalies.push({
      level: "中",
      title: "退款记录",
      detail: `${order?.itemName || refund.orderId} 已登记退款 ${refund.amount} 元。`
    });
  });
  return anomalies.slice(0, 8);
}

function matchesFilters(record, filters) {
  if (filters.departmentId && record.departmentId !== filters.departmentId) return false;
  if (filters.doctorUserId && record.doctorUserId !== filters.doctorUserId) return false;
  return true;
}

function buildActionItems(context) {
  const actions = [];
  if (!context.hasExam) actions.push("先补齐伍德灯/面积评估，给方案提供客观依据。");
  if (!context.hasTreatment) actions.push("输出首期治疗目标：检查、起始疗程、复诊时间和观察指标。");
  if (context.daysToNextVisit !== null && context.daysToNextVisit < 0) actions.push("复诊已逾期，优先电话/微信确认可到院时间。");
  if (context.riskScore >= 70) actions.push("安排医生或咨询师当日跟进，重点处理费用、时间或家属顾虑。");
  if (context.conversionRate >= 70) actions.push("强调已看到的正向变化，推动确认下一疗程。");
  if (context.latestFollowUp?.specialConcern) actions.push(`围绕患者关注点回应：${context.latestFollowUp.specialConcern}`);
  if (!actions.length) actions.push("维持每周回访，复诊前2天提醒到院。");
  return actions;
}

function buildTalkScript({ patient, riskLevel, conversionRate, latestTreatment, latestFollowUp }) {
  const concern = latestFollowUp?.specialConcern || "治疗周期和阶段效果";
  const nextVisit = latestTreatment?.nextVisit || "本周内";
  return [
    `${patient.nameAlias || "您好"}，我看到您目前属于${patient.tag || "待评估"}，这类情况最关键的是把检查、治疗和复诊节奏连续起来。`,
    `系统当前评估为${riskLevel}，成交/复诊概率约${conversionRate}%。这个数字只用于辅助跟进，不替代医生判断。`,
    `您现在最需要确认的是：${concern}。我们可以先把${nextVisit}的复诊或线上回访确定下来，再根据伍德灯/面积变化调整方案。`
  ].join("\n");
}

function suggestFollowUpDate(now, riskScore) {
  const date = new Date(now);
  date.setDate(date.getDate() + (riskScore >= 70 ? 1 : riskScore >= 45 ? 3 : 7));
  return date.toISOString().slice(0, 10);
}

function getLatestByDate(items) {
  if (!items?.length) return null;
  return [...items].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))[0];
}

function dateDiffInDays(from, toDate) {
  const start = new Date(from);
  const end = new Date(toDate);
  if (Number.isNaN(end.getTime())) return null;
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.round((end - start) / 86400000);
}

function queuePrefix(departmentId) {
  if (departmentId === "dept-follow") return "B";
  if (departmentId === "dept-light") return "L";
  if (departmentId === "dept-exam") return "E";
  return "A";
}

function userIdByDoctorName(users, doctorName) {
  return users?.find((user) => user.role === "doctor" && user.name === doctorName)?.id;
}

function userNameById(users, userId) {
  return users?.find((user) => user.id === userId)?.name;
}

function patientName(state, patientId) {
  return state.patients.find((patient) => patient.id === patientId)?.nameAlias || patientId;
}

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || "未填";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function sum(items, key) {
  return items.reduce((total, item) => total + (Number(item[key]) || 0), 0);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampNumber(value, min, max) {
  const parsed = Number.parseFloat(String(value ?? "").replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(parsed)) return 0;
  return clamp(parsed, min, max);
}

function formatMetric(value) {
  const number = Number(value) || 0;
  return Number(number.toFixed(2));
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
