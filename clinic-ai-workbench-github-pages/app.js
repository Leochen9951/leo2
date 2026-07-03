import {
  BODY_REGION_DEFINITIONS,
  ROLE_LABELS,
  STORAGE_KEY,
  VASI_DEPIGMENTATION_OPTIONS,
  VITILIGO_TEMPLATE_LABELS,
  applyMedicalRecordAction,
  assessPatient,
  calculateSpecialtyMetrics,
  can,
  canAccessPatient,
  createAuditLog,
  createDefaultState,
  createDepartment,
  createEmptyPatient,
  createEmptyUserDraft,
  createImageUploadEntry,
  createPatientCreateDraft,
  createPaymentRecord,
  createPrescriptionRecord,
  createRefundRecord,
  createRegistration,
  createServiceOrder,
  createVasiSnapshot,
  formatMedicalRecordText,
  getVisiblePatients,
  getRecordQuality,
  makeBlankEntry,
  mergeImportedRows,
  normalizeState,
  summarizeDirector
} from "./analysis.js";

const patientTabs = [
  { id: "basic", label: "基本信息", read: "patient:basic" },
  { id: "record", label: "门诊病历", read: "record:read" },
  { id: "specialty", label: "专科评估", read: "specialty:view", alt: "record:read" },
  { id: "exam", label: "检查报告", read: "exam:write" },
  { id: "images", label: "照片时间轴", read: "image:view" },
  { id: "treatment", label: "治疗记录", read: "treatment:write" },
  { id: "orders", label: "项目/疗程", read: "order:create", alt: "sales:view" },
  { id: "prescriptions", label: "处方监管", read: "prescription:create", alt: "prescription:view" },
  { id: "follow", label: "回访记录", read: "followup:write" },
  { id: "ai", label: "智能分析", read: "record:read" }
];

const modules = [
  { id: "guide", label: "导医台", permission: "registration:create" },
  { id: "patients", label: "患者工作台", permission: "patient:list" },
  { id: "director", label: "院长看板", permission: "dashboard:view" },
  { id: "settings", label: "权限管理", permission: "settings:view" },
  { id: "audit", label: "审计日志", permission: "audit:view" }
];

const permissionOptions = [
  ["*", "全部权限"],
  ["patient:list", "患者列表"],
  ["patient:create", "新建患者"],
  ["patient:basic", "患者基本信息"],
  ["record:read", "查看病历"],
  ["record:write", "书写病历"],
  ["record:sign", "医生签名"],
  ["specialty:view", "查看专科评估"],
  ["specialty:write", "记录专科评估"],
  ["exam:write", "检查报告"],
  ["image:view", "查看照片"],
  ["image:write", "维护照片"],
  ["treatment:write", "治疗记录"],
  ["phototherapy:write", "光疗剂量记录"],
  ["followup:write", "回访记录"],
  ["order:create", "项目/疗程开单"],
  ["sales:view", "销售统计"],
  ["prescription:create", "处方记录"],
  ["prescription:view", "查看处方"],
  ["prescription:review", "审核处方"],
  ["registration:create", "挂号分诊"],
  ["registration:update", "更新候诊"],
  ["queue:view", "查看队列"],
  ["queue:accept", "接诊队列"],
  ["dashboard:view", "院长看板"],
  ["audit:view", "审计日志"],
  ["cross_department:view", "跨科室查看"],
  ["export:data", "导出/备份"],
  ["settings:view", "查看权限管理"],
  ["settings:manage", "维护权限管理"]
];

let state = loadState();
let toast = "";

const app = document.querySelector("#app");
render();

app.addEventListener("pointerdown", (event) => {
  const closeButton = event.target.closest('[data-action="close-crud-modal"]');
  if (!closeButton) return;
  event.preventDefault();
  closeCrudModal();
  saveAndRender();
}, true);

app.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const user = getCurrentUser();

  if (action === "login") {
    const selected = state.users.find((item) => item.id === state.loginSelectedUserId && item.enabled);
    if (!selected) return deny("请选择可用账号。");
    state.sessionUserId = selected.id;
    state.currentUserId = selected.id;
    state.module = defaultModuleForUser(selected);
    ensureVisiblePatient();
    addAudit("auth:login", "User", selected.id, "用户登录系统。");
    showToast(`已登录：${selected.name}`);
    saveAndRender();
    return;
  }

  if (action === "logout") {
    if (user) addAudit("auth:logout", "User", user.id, "用户退出系统。");
    state.sessionUserId = "";
    state.currentUserId = "";
    showToast("已退出登录。");
    saveAndRender();
    return;
  }

  if (!user) {
    render();
    return;
  }

  if (action === "nav") {
    const nextModule = button.dataset.module;
    if (nextModule === "settings" && !canAccessSettings(user)) return deny("当前角色不能查看权限管理。");
    state.module = nextModule;
    if (nextModule === "settings") {
      state.settingsMenuOpen = true;
      state.drawerCollapsed = false;
      state.settingsSection = getSettingsSection();
    }
    if (nextModule !== "patients") {
      state.showPatientCreateForm = false;
    }
    state.crudModal = null;
    if (state.module === "patients") ensureVisiblePatient();
    saveAndRender();
    return;
  }

  if (action === "settings-menu-toggle") {
    if (!canAccessSettings(user)) return deny("当前角色不能查看权限管理。");
    state.module = "settings";
    state.settingsMenuOpen = true;
    state.drawerCollapsed = false;
    state.settingsSection = getSettingsSection();
    state.showPatientCreateForm = false;
    saveAndRender();
    return;
  }

  if (action === "toggle-drawer") {
    state.drawerCollapsed = !state.drawerCollapsed;
    saveAndRender();
    return;
  }

  if (action === "select") {
    state.selectedId = button.dataset.id;
    state.module = "patients";
    state.crudModal = null;
    ensureVisiblePatient();
    saveAndRender();
    return;
  }

  if (action === "tab") {
    state.activeTab = button.dataset.tab;
    state.crudModal = null;
    if (state.activeTab === "images") {
      addAudit("image:view", "Patient", state.selectedId, "查看患者照片时间轴。");
    }
    if (state.activeTab === "specialty") {
      addAudit("specialty:view", "Patient", state.selectedId, "查看白癜风专科评估。");
    }
    saveAndRender();
    return;
  }

  if (action === "close-crud-modal") {
    closeCrudModal();
    saveAndRender();
    return;
  }

  if (action === "toggle-body-region") {
    const patient = getSelectedPatient();
    if (!canEditSpecialty(user, patient)) return deny("当前角色不能维护专科部位图。");
    const region = patient.specialtyAssessment?.bodyRegions?.find((item) => item.id === button.dataset.region);
    if (!region) return;
    region.active = !region.active;
    if (region.active && !region.affectedBsaPercent) region.affectedBsaPercent = "0.5";
    showToast(`${region.active ? "已标记" : "已取消"}${bodyRegionLabel(region.id)}。`);
    saveAndRender();
    return;
  }

  if (action === "save-vasi-snapshot") {
    const patient = getSelectedPatient();
    if (!canEditSpecialty(user, patient)) return deny("当前角色不能保存面积和白斑评分评估。");
    const snapshot = createVasiSnapshot(patient, user.id);
    patient.specialtyAssessment.vasiHistory ||= [];
    patient.specialtyAssessment.vasiHistory.unshift(snapshot);
    patient.medicalRecord.vitiligoAssessment.areaPercent = `${snapshot.bsaPercent}%`;
    addAudit("specialty:vasiSnapshot", "Patient", patient.id, `保存面积和白斑评分：体表面积 ${snapshot.bsaPercent}%，白斑评分 ${snapshot.vasiScore}。`);
    showToast("已保存本次专科评分快照。");
    saveAndRender();
    return;
  }

  if (action === "add-patient") {
    if (!can(user, "patient:create")) return deny("当前角色不能新建患者。");
    if (state.module !== "patients") return deny("请先进入患者工作台后再新建患者。");
    state.showPatientCreateForm = true;
    state.patientCreateDraft = createDefaultPatientDraft(user);
    saveAndRender();
    return;
  }

  if (action === "open-basic-modal") {
    const patient = getSelectedPatient();
    if (!canAccessPatient(user, patient, "basic")) return deny("当前角色不能查看该患者。");
    state.crudModal = { type: "patientBasic", patientId: patient.id };
    saveAndRender();
    return;
  }

  if (action === "save-patient-create") {
    if (!can(user, "patient:create")) return deny("当前角色不能新建患者。");
    if (state.module !== "patients") return deny("请先进入患者工作台后再新建患者。");
    const result = savePatientCreateDraft(user);
    if (!result.ok) return deny(result.message);
    addAudit("patient:create", "Patient", result.patient.id, "通过患者工作台弹框新建脱敏患者。");
    showToast("患者已建档。");
    saveAndRender();
    return;
  }

  if (action === "cancel-patient-create") {
    state.showPatientCreateForm = false;
    state.patientCreateDraft = createDefaultPatientDraft(user);
    showToast("已取消新建患者。");
    saveAndRender();
    return;
  }

  if (action === "tag-filter") {
    state.tagFilter = button.dataset.tag || "";
    saveAndRender();
    return;
  }

  if (action === "register-patient") {
    if (!can(user, "registration:create")) return deny("当前角色不能挂号分诊。");
    const patient = findOrCreateRegistrationPatient();
    const registration = createRegistration({
      patientId: patient.id,
      departmentId: state.registrationDraft.departmentId,
      doctorUserId: state.registrationDraft.doctorUserId,
      guideUserId: user.id,
      note: state.registrationDraft.note
    }, state.registrations.length);
    patient.departmentId = registration.departmentId;
    patient.ownerUserId = registration.doctorUserId || patient.ownerUserId;
    patient.doctor = userName(registration.doctorUserId) || patient.doctor;
    patient.status = "候诊中";
    state.registrations.unshift(registration);
    state.selectedId = patient.id;
    state.registrationDraft = { ...state.registrationDraft, nameAlias: "", contact: "", note: "" };
    addAudit("registration:create", "Registration", registration.id, `导医挂号到 ${departmentName(registration.departmentId)}。`);
    showToast(`已生成候诊号 ${registration.queueNo}。`);
    saveAndRender();
    return;
  }

  if (action === "queue-status") {
    const registration = state.registrations.find((item) => item.id === button.dataset.id);
    if (!registration || !can(user, "registration:update") && !can(user, "queue:accept")) return deny("当前角色不能更新队列。");
    registration.status = button.dataset.status;
    const patient = findPatient(registration.patientId);
    if (patient) {
      patient.status = registration.status === "接诊中" ? "接诊中" : registration.status === "已完成" ? "治疗中" : patient.status;
      patient.departmentId = registration.departmentId;
      patient.ownerUserId = registration.doctorUserId || patient.ownerUserId;
      patient.doctor = userName(patient.ownerUserId) || patient.doctor;
      state.selectedId = patient.id;
    }
    addAudit("registration:update", "Registration", registration.id, `队列状态更新为 ${registration.status}。`);
    if (registration.status === "接诊中") state.module = "patients";
    showToast("队列状态已更新。");
    saveAndRender();
    return;
  }

  if (action === "add-entry") {
    const patient = getSelectedPatient();
    const arrayName = button.dataset.array;
    if (!canEditPatientArray(user, arrayName, patient)) return deny("当前角色不能新增该类记录。");
    patient[arrayName].unshift(makeBlankEntry(button.dataset.type));
    state.crudModal = { type: "entry", arrayName, index: 0, title: button.dataset.title || "记录" };
    addAudit(`${arrayName}:create`, "Patient", patient.id, `新增${button.dataset.title || "记录"}。`);
    showToast("已新增记录，请在弹窗中编辑。");
    saveAndRender();
    return;
  }

  if (action === "open-entry-modal") {
    const patient = getSelectedPatient();
    const arrayName = button.dataset.array;
    if (!patient?.[arrayName]) return;
    state.crudModal = { type: "entry", arrayName, index: Number(button.dataset.index), title: button.dataset.title || "记录" };
    saveAndRender();
    return;
  }

  if (action === "delete-entry") {
    const patient = getSelectedPatient();
    const arrayName = button.dataset.array;
    if (!canEditPatientArray(user, arrayName, patient)) return deny("当前角色不能删除该类记录。");
    patient[arrayName].splice(Number(button.dataset.index), 1);
    state.crudModal = null;
    addAudit(`${arrayName}:delete`, "Patient", patient.id, "删除患者工作台记录。");
    showToast("已删除该条记录。");
    saveAndRender();
    return;
  }

  if (action === "add-order") {
    const patient = getSelectedPatient();
    if (!can(user, "order:create") || !canAccessPatient(user, patient, "basic")) return deny("当前角色不能开项目/疗程。");
    const order = createServiceOrder({
      patientId: patient.id,
      departmentId: patient.departmentId,
      doctorUserId: patient.ownerUserId
    });
    state.serviceOrders.unshift(order);
    state.crudModal = { type: "order", id: order.id };
    addAudit("serviceOrder:create", "ServiceOrder", order.id, "医生手工新增项目/疗程开单。");
    showToast("已新增项目/疗程记录，请在弹窗中编辑。");
    saveAndRender();
    return;
  }

  if (action === "open-order-modal") {
    if (!state.serviceOrders.some((item) => item.id === button.dataset.id)) return;
    state.crudModal = { type: "order", id: button.dataset.id };
    saveAndRender();
    return;
  }

  if (action === "order-paid") {
    const order = state.serviceOrders.find((item) => item.id === button.dataset.id);
    if (!order || !can(user, "order:create") && !can(user, "sales:view")) return deny("当前角色不能更新项目收款。");
    order.status = "已成交";
    if (!state.paymentRecords.some((payment) => payment.orderId === order.id)) {
      state.paymentRecords.unshift(createPaymentRecord(order));
    }
    addAudit("payment:create", "ServiceOrder", order.id, `登记成交收款 ${Number(order.amount) || 0} 元。`);
    showToast("已登记成交收款。");
    saveAndRender();
    return;
  }

  if (action === "order-refund") {
    const order = state.serviceOrders.find((item) => item.id === button.dataset.id);
    if (!order || !can(user, "sales:view")) return deny("当前角色不能登记退款。");
    order.status = "已退款";
    if (!state.refundRecords.some((refund) => refund.orderId === order.id)) {
      state.refundRecords.unshift(createRefundRecord(order));
    }
    addAudit("refund:create", "ServiceOrder", order.id, `登记项目退款 ${Number(order.amount) || 0} 元。`);
    showToast("已登记退款。");
    saveAndRender();
    return;
  }

  if (action === "add-prescription") {
    const patient = getSelectedPatient();
    if (!can(user, "prescription:create") || !canAccessPatient(user, patient, "record")) return deny("当前角色不能开处方记录。");
    const prescription = createPrescriptionRecord({
      patientId: patient.id,
      departmentId: patient.departmentId,
      doctorUserId: user.id
    });
    state.prescriptionRecords.unshift(prescription);
    state.crudModal = { type: "prescription", id: prescription.id };
    addAudit("prescription:create", "PrescriptionRecord", prescription.id, "医生手工新增处方草稿。");
    showToast("已新增处方草稿，请在弹窗中编辑。");
    saveAndRender();
    return;
  }

  if (action === "open-prescription-modal") {
    if (!state.prescriptionRecords.some((item) => item.id === button.dataset.id)) return;
    state.crudModal = { type: "prescription", id: button.dataset.id };
    saveAndRender();
    return;
  }

  if (action === "prescription-status") {
    const prescription = state.prescriptionRecords.find((item) => item.id === button.dataset.id);
    if (!prescription) return;
    const nextStatus = button.dataset.status;
    if (nextStatus === "待审核" && !can(user, "prescription:create")) return deny("当前角色不能提交处方审核。");
    if (["已审核", "退回", "作废"].includes(nextStatus) && !can(user, "prescription:review")) return deny("当前角色不能审核处方。");
    prescription.status = nextStatus;
    if (["已审核", "退回", "作废"].includes(nextStatus)) prescription.reviewBy = user.id;
    addAudit("prescription:review", "PrescriptionRecord", prescription.id, `处方状态更新为 ${nextStatus}。`);
    showToast("处方状态已更新。");
    saveAndRender();
    return;
  }

  if (action === "record-action") {
    const patient = getSelectedPatient();
    const recordAction = button.dataset.recordAction;
    if (!can(user, "record:write") || !canAccessPatient(user, patient, "record")) return deny("当前角色不能操作电子病历。");
    if (recordAction === "sign" && !can(user, "record:sign")) return deny("当前角色不能签名病历。");
    if (recordAction === "archive") {
      const quality = getRecordQuality(patient);
      if (!patient.medicalRecord.signedBy) return deny("归档前需要医生签名。");
      if (quality.missing.length) return deny(`质控未通过：${quality.missing.join("、")}`);
    }
    applyMedicalRecordAction(patient, user.id, recordAction, button.dataset.note || "");
    addAudit(`medicalRecord:${recordAction}`, "MedicalRecord", patient.id, recordActionLabel(recordAction));
    showToast(recordActionLabel(recordAction));
    saveAndRender();
    return;
  }

  if (action === "copy-record-text") {
    const patient = getSelectedPatient();
    if (!can(user, "record:read") || !canAccessPatient(user, patient, "record")) return deny("当前角色不能导出病历。");
    addAudit("medicalRecord:exportText", "MedicalRecord", patient.id, "复制电子病历文本。");
    await copyText(formatMedicalRecordText(patient, state));
    return;
  }

  if (action === "copy-record-json") {
    const patient = getSelectedPatient();
    if (!can(user, "record:read") || !canAccessPatient(user, patient, "record")) return deny("当前角色不能导出病历。");
    addAudit("medicalRecord:exportJson", "MedicalRecord", patient.id, "复制电子病历结构化数据。");
    await copyText(JSON.stringify({ patientId: patient.id, medicalRecord: patient.medicalRecord }, null, 2));
    return;
  }

  if (action === "print-record") {
    const patient = getSelectedPatient();
    if (!can(user, "record:read") || !canAccessPatient(user, patient, "record")) return deny("当前角色不能打印病历。");
    addAudit("medicalRecord:print", "MedicalRecord", patient.id, "打开电子病历打印窗口。");
    printMedicalRecord(patient);
    showToast("已打开病历打印窗口。");
    saveAndRender();
    return;
  }

  if (action === "add-department") {
    if (!can(user, "settings:manage")) return deny("当前角色不能维护科室字典。");
    const department = createDepartment(state.departments.length + 1);
    state.departments.push(department);
    state.crudModal = { type: "department", id: department.id };
    addAudit("department:create", "Department", department.id, "新增自定义科室。");
    showToast("已新增科室，请在弹窗中编辑。");
    saveAndRender();
    return;
  }

  if (action === "edit-department") {
    if (!canAccessSettings(user)) return deny("当前角色不能查看科室字典。");
    if (!state.departments.some((item) => item.id === button.dataset.id)) return;
    state.crudModal = { type: "department", id: button.dataset.id };
    saveAndRender();
    return;
  }

  if (action === "toggle-department") {
    if (!can(user, "settings:manage")) return deny("当前角色不能启停科室。");
    const department = state.departments.find((item) => item.id === button.dataset.id);
    if (!department) return;
    department.enabled = !department.enabled;
    addAudit("department:update", "Department", department.id, `${department.enabled ? "启用" : "停用"}科室。`);
    saveAndRender();
    return;
  }

  if (action === "delete-department") {
    if (!can(user, "settings:manage")) return deny("当前角色不能删除科室。");
    const department = state.departments.find((item) => item.id === button.dataset.id);
    if (!department) return;
    if (state.departments.length <= 1) return deny("至少需要保留一个科室。");
    const usage = getDepartmentUsage(department.id);
    if (usage.businessCount > 0) {
      return deny(`该科室已有${departmentUsageText(usage)}，不能删除，可先停用。`);
    }
    if (!confirm(`确认删除科室「${department.name}」？账号中的该科室权限也会自动移除。`)) return;
    removeDepartment(department.id);
    state.crudModal = null;
    addAudit("department:delete", "Department", department.id, `删除科室：${department.name}。`);
    showToast("科室已删除。");
    saveAndRender();
    return;
  }

  if (action === "settings-section" || action === "settings-subnav") {
    if (!canAccessSettings(user)) return deny("当前角色不能查看权限管理。");
    state.module = "settings";
    state.settingsMenuOpen = true;
    state.settingsSection = button.dataset.section || "users";
    state.crudModal = null;
    saveAndRender();
    return;
  }

  if (action === "edit-user-permission") {
    if (!canAccessSettings(user)) return deny("当前角色不能查看账号权限。");
    state.selectedPermissionUserId = button.dataset.id;
    state.crudModal = { type: "user", id: button.dataset.id };
    saveAndRender();
    return;
  }

  if (action === "toggle-new-user-form") {
    if (!can(user, "settings:manage")) return deny("当前角色不能新建账号。");
    state.showNewUserForm = true;
    state.newUserDraft ||= createEmptyUserDraft(nextNewUserDraftNumber());
    state.crudModal = { type: "newUser" };
    saveAndRender();
    return;
  }

  if (action === "save-user-permission") {
    if (!can(user, "settings:manage")) return deny("当前角色不能保存账号权限。");
    if (!isUserDraftDirty(button.dataset.id)) {
      showToast("当前账号没有未保存修改。");
      render();
      return;
    }
    const result = saveUserDraft(button.dataset.id, user.id);
    if (!result.ok) return deny(result.message);
    state.crudModal = null;
    addAudit("user:update", "User", button.dataset.id, "保存账号角色、科室和界面权限。");
    showToast("账号权限已保存。");
    saveAndRender();
    return;
  }

  if (action === "cancel-user-draft") {
    if (!can(user, "settings:manage")) return deny("当前角色不能取消账号编辑。");
    delete state.userPermissionDrafts[button.dataset.id];
    state.crudModal = null;
    showToast("已取消未保存的账号修改。");
    saveAndRender();
    return;
  }

  if (action === "save-new-user") {
    if (!can(user, "settings:manage")) return deny("当前角色不能新建账号。");
    const result = saveNewUserDraft();
    if (!result.ok) return deny(result.message);
    state.selectedPermissionUserId = result.user.id;
    state.showNewUserForm = false;
    state.crudModal = null;
    state.accountSearch = "";
    addAudit("user:create", "User", result.user.id, `新建账号：${result.user.name}（${result.user.loginName}）。`);
    showToast("新账号已保存。");
    saveAndRender();
    return;
  }

  if (action === "reset-new-user") {
    if (!can(user, "settings:manage")) return deny("当前角色不能重置新账号草稿。");
    state.newUserDraft = createEmptyUserDraft(nextNewUserDraftNumber());
    showToast("新账号草稿已重置。");
    saveAndRender();
    return;
  }

  if (action === "add-role") {
    if (!can(user, "settings:manage")) return deny("当前角色不能新增角色。");
    const role = createRoleDraft();
    state.roles.push(role);
    state.selectedRoleId = role.id;
    state.roleSearch = "";
    state.crudModal = { type: "role", id: role.id };
    addAudit("role:create", "Role", role.id, `新增角色：${role.name}。`);
    showToast("已新增角色，可继续配置权限。");
    saveAndRender();
    return;
  }

  if (action === "edit-role") {
    if (!canAccessSettings(user)) return deny("当前角色不能查看角色管理。");
    state.selectedRoleId = button.dataset.id;
    state.crudModal = { type: "role", id: button.dataset.id };
    saveAndRender();
    return;
  }

  if (action === "delete-role") {
    if (!can(user, "settings:manage")) return deny("当前角色不能删除角色。");
    const role = state.roles.find((item) => item.id === button.dataset.id);
    if (!role) return;
    const userCount = state.users.filter((item) => item.role === role.id).length;
    if (userCount) return deny(`该角色已有 ${userCount} 个账号使用，不能删除。`);
    if (!confirm(`确认删除角色「${role.name}」？`)) return;
    state.roles = state.roles.filter((item) => item.id !== role.id);
    if (state.selectedRoleId === role.id) state.selectedRoleId = state.roles[0]?.id || "";
    state.crudModal = null;
    if (state.newUserDraft.role === role.id) {
      state.newUserDraft.role = "guide";
      state.newUserDraft.moduleAccess = defaultModuleAccessForRole("guide");
    }
    addAudit("role:delete", "Role", role.id, `删除角色：${role.name}。`);
    showToast("角色已删除。");
    saveAndRender();
    return;
  }

  if (action === "copy-script") {
    const analysis = assessPatient(getSelectedPatient());
    await copyText(analysis.talkScript);
    return;
  }

  if (action === "copy-json") {
    if (!can(user, "export:data")) return deny("当前角色不能导出数据。");
    addAudit("export:data", "State", "localStorage", "复制脱敏备份数据。");
    await copyText(JSON.stringify(state, null, 2));
    return;
  }

  if (action === "copy-audit") {
    if (!can(user, "audit:view")) return deny("当前角色不能导出审计日志。");
    addAudit("audit:export", "AuditLog", "all", "复制审计日志 JSON。");
    await copyText(JSON.stringify(state.auditLogs, null, 2));
    return;
  }

  if (action === "reset-demo") {
    if (confirm("确认恢复演示数据？当前浏览器内的编辑会被覆盖。")) {
      const sessionUserId = state.sessionUserId;
      state = createDefaultState();
      if (state.users.some((item) => item.id === sessionUserId && item.enabled)) {
        state.sessionUserId = sessionUserId;
        state.currentUserId = sessionUserId;
        state.loginSelectedUserId = sessionUserId;
      }
      showToast("已恢复 v2 演示数据。");
      saveAndRender();
    }
  }
});

app.addEventListener("input", (event) => {
  const target = event.target;
  if (target.dataset.search === "query") {
    const cursor = target.selectionStart;
    state.query = target.value;
    render();
    requestAnimationFrame(() => {
      const search = document.querySelector('[data-search="query"]');
      search?.focus();
      search?.setSelectionRange(cursor, cursor);
    });
    return;
  }
  if ("accountSearch" in target.dataset) {
    const cursor = target.selectionStart;
    state.accountSearch = target.value;
    persist();
    render();
    requestAnimationFrame(() => {
      const search = document.querySelector("[data-account-search]");
      search?.focus();
      search?.setSelectionRange(cursor, cursor);
    });
    return;
  }
  if ("roleSearch" in target.dataset) {
    const cursor = target.selectionStart;
    state.roleSearch = target.value;
    persist();
    render();
    requestAnimationFrame(() => {
      const search = document.querySelector("[data-role-search]");
      search?.focus();
      search?.setSelectionRange(cursor, cursor);
    });
    return;
  }
  if (target.dataset.patientCreate) {
    state.patientCreateDraft[target.dataset.patientCreate] = target.value;
    persist();
    return;
  }
  if (target.dataset.draft) {
    state.registrationDraft[target.dataset.draft] = target.value;
    persist();
    return;
  }
  if (target.dataset.userField) {
    updateUserDraftField(target.dataset.id, target.dataset.userField, target.value);
    persist();
    return;
  }
  if (target.dataset.newUserField) {
    updateNewUserDraftField(target.dataset.newUserField, target.value);
    persist();
    return;
  }
  if (target.dataset.stateArray) {
    updateStateArrayItem(target);
    persist();
    return;
  }
  if (target.dataset.departmentField) {
    const department = state.departments.find((item) => item.id === target.dataset.id);
    if (department) department[target.dataset.departmentField] = target.value;
    persist();
    return;
  }
  if (target.dataset.roleField) {
    const role = state.roles.find((item) => item.id === target.dataset.id);
    if (role) {
      role[target.dataset.roleField] = target.value;
      refreshUserRoleFields();
    }
    persist();
    return;
  }
  const patient = getSelectedPatient();
  if (target.dataset.array && patient) {
    const item = patient[target.dataset.array][Number(target.dataset.index)];
    item[target.dataset.field] = target.value;
    persist();
    renderHeaderOnly();
    return;
  }
  if (target.dataset.field && patient) {
    const previousId = patient.id;
    setPath(patient, target.dataset.field, target.value);
    if (target.dataset.field === "id" && state.selectedId === previousId) state.selectedId = target.value;
    persist();
    renderHeaderOnly();
    return;
  }
});

app.addEventListener("change", async (event) => {
  const target = event.target;
  if (target.dataset.loginUser) {
    state.loginSelectedUserId = target.value;
    persist();
    render();
    return;
  }
  const user = getCurrentUser();
  if (!user) return;
  if (target.dataset.filter === "tag") {
    state.tagFilter = target.value;
    render();
    return;
  }
  if (target.dataset.filter === "queue") {
    state.queueFilter = target.value;
    render();
    return;
  }
  if (target.dataset.dashboardFilter) {
    state.dashboardFilters[target.dataset.dashboardFilter] = target.value;
    addAudit("dashboard:filter", "Dashboard", "director", "院长看板筛选发生变化。");
    saveAndRender();
    return;
  }
  if (target.dataset.draft) {
    state.registrationDraft[target.dataset.draft] = target.value;
    persist();
    renderGuideDoctorHint();
    return;
  }
  if (target.dataset.userField) {
    updateUserDraftField(target.dataset.id, target.dataset.userField, target.value);
    persist();
    render();
    return;
  }
  if (target.dataset.newUserField) {
    updateNewUserDraftField(target.dataset.newUserField, target.value);
    persist();
    render();
    return;
  }
  if (target.dataset.patientCreate) {
    state.patientCreateDraft[target.dataset.patientCreate] = target.value;
    persist();
    render();
    return;
  }
  if (target.dataset.userDepartment) {
    updateUserDraftCollection(target.dataset.id, "departmentIds", target.dataset.userDepartment, target.checked);
    persist();
    render();
    return;
  }
  if (target.dataset.userModule) {
    if (target.dataset.id === user.id && target.dataset.userModule === "settings" && !target.checked) {
      target.checked = true;
      return deny("不能移除当前管理员账号的权限管理界面。");
    }
    updateUserDraftCollection(target.dataset.id, "moduleAccess", target.dataset.userModule, target.checked);
    persist();
    render();
    return;
  }
  if (target.dataset.newUserDepartment) {
    updateNewUserDraftCollection("departmentIds", target.dataset.newUserDepartment, target.checked);
    persist();
    render();
    return;
  }
  if (target.dataset.newUserModule) {
    updateNewUserDraftCollection("moduleAccess", target.dataset.newUserModule, target.checked);
    persist();
    render();
    return;
  }
  if (target.dataset.rolePermission) {
    const role = state.roles.find((item) => item.id === target.dataset.id);
    if (role?.id === user.role) {
      const nextPermissions = new Set(role.permissions || []);
      if (target.checked) nextPermissions.add(target.dataset.rolePermission);
      else nextPermissions.delete(target.dataset.rolePermission);
      const canStillManageSettings = nextPermissions.has("*") || nextPermissions.has("settings:manage");
      if (!canStillManageSettings) {
        target.checked = !target.checked;
        return deny("不能移除当前登录角色的权限管理维护权限。");
      }
    }
    updateRoleCollection(target.dataset.id, "permissions", target.dataset.rolePermission, target.checked);
    refreshUserRoleFields();
    persist();
    render();
    return;
  }
  if (target.dataset.roleModule) {
    updateRoleCollection(target.dataset.id, "moduleAccess", target.dataset.roleModule, target.checked);
    persist();
    render();
    return;
  }
  if (target.dataset.stateArray) {
    updateStateArrayItem(target);
    persist();
    render();
    return;
  }
  if (target.dataset.departmentField) {
    const department = state.departments.find((item) => item.id === target.dataset.id);
    if (department) department[target.dataset.departmentField] = target.value;
    persist();
    render();
    return;
  }
  if (target.dataset.recordPhotoUpload) {
    await handleRecordPhotoUpload(target, user);
    return;
  }
  if (target.dataset.array || target.dataset.field) {
    const patient = getSelectedPatient();
    if (target.dataset.array && patient) {
      const item = patient[target.dataset.array][Number(target.dataset.index)];
      item[target.dataset.field] = target.value;
    }
    if (target.dataset.field && patient) {
      const previousId = patient.id;
      setPath(patient, target.dataset.field, target.value);
      if (target.dataset.field === "id" && state.selectedId === previousId) state.selectedId = target.value;
    }
    persist();
    render();
    return;
  }
  if (target.dataset.csv === "import") {
    const file = target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    state.patients = mergeImportedRows(state.patients, rows);
    state.selectedId = state.patients[0]?.id || state.selectedId;
    addAudit("patient:import", "Patient", "表格导入", `导入/合并 ${rows.length} 条表格记录。`);
    showToast(`已导入/合并 ${rows.length} 条表格记录。`);
    target.value = "";
    saveAndRender();
  }
});

function render() {
  const user = getCurrentUser();
  if (!user) {
    app.className = "login-shell";
    app.innerHTML = renderLogin();
    return;
  }
  ensureAllowedModule();
  const showPatientRail = state.module !== "settings";
  app.className = `app-shell ${showPatientRail ? "has-patient-rail" : "settings-content-mode"} ${state.drawerCollapsed ? "drawer-collapsed" : "drawer-expanded"}`;
  app.innerHTML = `
    ${renderSidebar(user)}
    <main class="workspace">
      ${renderPublicDemoNotice()}
      ${renderWorkspaceHeader(user)}
      ${renderModule(user)}
    </main>
    ${showPatientRail ? renderPatientRail(user) : ""}
    ${state.module === "patients" && can(user, "patient:create") && state.showPatientCreateForm ? renderPatientCreateModal(user) : ""}
    ${renderCrudModal(user)}
  `;
}

function renderLogin() {
  const enabledUsers = state.users.filter((item) => item.enabled);
  const visiblePatients = state.patients.length;
  const todayQueue = state.registrations.filter((item) => item.createdAt === todayString()).length;
  const pendingRx = state.prescriptionRecords.filter((item) => ["草稿", "待审核", "退回"].includes(item.status)).length;
  return `
    <main class="login-page">
      <section class="login-stage">
        <aside class="login-visual-panel">
          <span class="badge">专科门诊演示系统</span>
          <div>
            <h1>白癜风门诊系统</h1>
            <p>围绕导医挂号、电子病历、专科评估、处方监管和院长看板搭建的门诊工作台。</p>
          </div>
          <div class="login-metrics">
            <div><strong>${visiblePatients}</strong><span>演示患者</span></div>
            <div><strong>${todayQueue}</strong><span>今日挂号</span></div>
            <div><strong>${pendingRx}</strong><span>处方待办</span></div>
          </div>
          <div class="login-flow-strip">
            <span>导医分诊</span>
            <span>医生接诊</span>
            <span>专科评估</span>
            <span>经营监管</span>
          </div>
        </aside>
        <section class="login-card">
          <div class="login-brand">
            <span class="badge">账号登录</span>
            <h2>进入工作台</h2>
            <p>管理员分配账号角色、所属科室和可见界面后，账号按权限进入系统。</p>
          </div>
          ${renderPublicDemoNotice("login")}
          <div class="field">
            <label>登录账号</label>
            <select class="select" data-login-user="1">
              ${enabledUsers.map((item) => `<option value="${escapeAttr(item.id)}" ${state.loginSelectedUserId === item.id ? "selected" : ""}>${escapeHtml(item.loginName || item.name)} · ${escapeHtml(item.name)} · ${roleName(item.role)}</option>`).join("")}
            </select>
          </div>
          <div class="login-preview">
            ${renderLoginPreview()}
          </div>
          <button class="btn primary login-button" data-action="login">登录系统</button>
        </section>
      </section>
    </main>
  `;
}

function renderPublicDemoNotice(variant = "") {
  return `
    <section class="public-demo-notice ${variant === "login" ? "compact" : ""}" role="note" aria-label="公开演示版提示">
      <strong>公开演示版</strong>
      <p>仅用于流程演示和需求沟通，禁止录入真实患者姓名、手机号、身份证、人脸照片或真实病历。数据保存在当前浏览器本地，不会上传服务器；前端权限仅用于原型演示，不能替代真实院内安全体系。</p>
    </section>
  `;
}

function renderWorkspaceHeader(user) {
  const current = modules.find((module) => module.id === state.module) || modules[0];
  const metrics = workspaceMetrics(user, current.id);
  return `
    <section class="workspace-hero">
      <div class="workspace-hero-main">
        <span class="section-eyebrow">${escapeHtml(moduleGroupName(current.id))}</span>
        <h2>${escapeHtml(current.label)}</h2>
        <p>${escapeHtml(moduleDescription(current.id))}</p>
        <div class="workspace-hero-tags">
          <span>${escapeHtml(user.name)}</span>
          <span>${escapeHtml(roleName(user.role))}</span>
          <span>${escapeHtml(todayString())}</span>
        </div>
      </div>
      <div class="workspace-hero-metrics">
        ${metrics.map((item) => `
          <div>
            <strong>${escapeHtml(item.value)}</strong>
            <span>${escapeHtml(item.label)}</span>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function workspaceMetrics(user, moduleId) {
  if (moduleId === "guide") {
    return [
      { label: "今日挂号", value: String(state.registrations.filter((item) => item.createdAt === todayString()).length) },
      { label: "候诊中", value: String(state.registrations.filter((item) => item.status === "候诊中").length) },
      { label: "启用科室", value: String(state.departments.filter((item) => item.enabled).length) }
    ];
  }
  if (moduleId === "director") {
    const summary = summarizeDirector(state, state.dashboardFilters);
    return [
      { label: "项目成交", value: money(summary.totals.gross) },
      { label: "净额", value: money(summary.totals.net) },
      { label: "处方待办", value: String(summary.totals.pendingPrescriptionCount) }
    ];
  }
  if (moduleId === "settings") {
    return [
      { label: "账号", value: String(state.users.length) },
      { label: "角色", value: String(state.roles.length) },
      { label: "科室", value: String(state.departments.length) }
    ];
  }
  if (moduleId === "audit") {
    return [
      { label: "审计记录", value: String(state.auditLogs.length) },
      { label: "今日记录", value: String(state.auditLogs.filter((item) => item.time?.startsWith(todayString())).length) },
      { label: "敏感查看", value: String(state.auditLogs.filter((item) => item.action?.includes("image") || item.action?.includes("export")).length) }
    ];
  }
  const patient = getSelectedPatient();
  return [
    { label: "可见患者", value: String(getFilteredPatients(user).length) },
    { label: "当前患者", value: patient?.nameAlias || "未选择" },
    { label: "处方待办", value: String(state.prescriptionRecords.filter((item) => ["草稿", "待审核", "退回"].includes(item.status)).length) }
  ];
}

function moduleGroupName(moduleId) {
  if (moduleId === "settings") return "系统配置";
  if (moduleId === "director" || moduleId === "audit") return "监管看板";
  return "门诊业务";
}

function moduleDescription(moduleId) {
  const descriptions = {
    guide: "新患者建档、老患者查重、科室分诊和候诊队列集中处理。",
    patients: "围绕患者主线管理电子病历、照片、专科评估、处方和回访。",
    director: "按科室和医生查看经营数据、处方记录、治疗执行和异常提醒。",
    settings: "管理员维护账号、角色、科室字典和可见界面权限。",
    audit: "追踪登录、挂号、处方、退款、导出和敏感照片查看等关键行为。"
  };
  return descriptions[moduleId] || "门诊工作台";
}

function renderLoginPreview() {
  const user = state.users.find((item) => item.id === state.loginSelectedUserId) || state.users.find((item) => item.enabled);
  if (!user) return `<p class="empty">暂无可登录账号。</p>`;
  return `
    <div class="login-preview-row">
      <span>登录账号</span>
      <strong>${escapeHtml(user.loginName || user.name)}</strong>
    </div>
    <div class="login-preview-row">
      <span>角色</span>
      <strong>${escapeHtml(roleName(user.role))}</strong>
    </div>
    <div class="login-preview-row">
      <span>所属科室</span>
      <strong>${escapeHtml((user.departmentIds || []).map(departmentName).join("、") || "未分配")}</strong>
    </div>
    <div class="login-preview-row">
      <span>可见界面</span>
      <strong>${escapeHtml((user.moduleAccess || []).map(moduleLabel).join("、") || "无")}</strong>
    </div>
  `;
}

function renderSidebar(user) {
  return `
    <aside class="sidebar app-drawer">
      <div class="brand drawer-brand">
        <span class="drawer-logo">系统</span>
        <div class="drawer-text">
          <h1>白癜风门诊</h1>
          <p>门诊管理系统 + 专病诊疗工作台</p>
        </div>
        <button class="drawer-toggle" data-action="toggle-drawer" title="${state.drawerCollapsed ? "展开菜单" : "收起菜单"}">${state.drawerCollapsed ? "展开" : "收起"}</button>
      </div>
      <div class="session-card drawer-session">
        <span class="drawer-menu-mark">${escapeHtml(user.name.slice(0, 1) || "账")}</span>
        <div class="drawer-text">
          <strong>${escapeHtml(user.name)}</strong>
          <span>${escapeHtml(user.loginName || "未设置登录账号")} · ${escapeHtml(roleName(user.role))} · ${escapeHtml((user.moduleAccess || []).map(moduleLabel).join("、") || "无界面权限")}</span>
        </div>
        <button class="btn ghost drawer-text" data-action="logout">退出</button>
      </div>
      <nav class="module-nav">
        ${renderDrawerModuleNav(user)}
      </nav>
      <div class="toast drawer-text">${escapeHtml(toast)}</div>
    </aside>
  `;
}

function renderDrawerModuleNav(user) {
  return modules
    .filter((module) => moduleVisible(module, user))
    .map((module) => module.id === "settings" ? renderSettingsDrawerGroup(module) : renderDrawerModuleButton(module))
    .join("");
}

function renderDrawerModuleButton(module) {
  return `
    <button class="module-btn drawer-nav-item ${state.module === module.id ? "active" : ""}" data-action="nav" data-module="${escapeAttr(module.id)}" title="${escapeAttr(module.label)}">
      <span class="drawer-menu-mark">${escapeHtml(moduleIcon(module))}</span>
      <span class="drawer-text">${escapeHtml(module.label)}</span>
    </button>
  `;
}

function renderSettingsDrawerGroup(module) {
  const active = state.module === "settings";
  const open = active && state.settingsMenuOpen !== false && !state.drawerCollapsed;
  return `
    <div class="drawer-nav-group ${active ? "active" : ""}">
      <button class="module-btn drawer-nav-item ${active ? "active" : ""}" data-action="settings-menu-toggle" title="${escapeAttr(module.label)}">
        <span class="drawer-menu-mark">${escapeHtml(moduleIcon(module))}</span>
        <span class="drawer-text">${escapeHtml(module.label)}</span>
        <span class="drawer-chevron drawer-text">${open ? "已展开" : "展开"}</span>
      </button>
      ${open ? `
        <div class="settings-subnav">
          ${renderSettingsSubnavButton("users", "账号管理")}
          ${renderSettingsSubnavButton("roles", "角色管理")}
          ${renderSettingsSubnavButton("departments", "科室字典")}
          ${renderSettingsSubnavButton("rules", "权限说明")}
        </div>
      ` : ""}
    </div>
  `;
}

function renderSettingsSubnavButton(sectionId, title) {
  const active = state.module === "settings" && getSettingsSection() === sectionId;
  return `
    <button class="settings-subnav-item ${active ? "active" : ""}" data-action="settings-subnav" data-section="${escapeAttr(sectionId)}">
      <span>${escapeHtml(title)}</span>
    </button>
  `;
}

function renderPatientRail(user) {
  const visiblePatients = getFilteredPatients(user);
  const tags = [...new Set(visiblePatients.map((patient) => patient.tag).filter(Boolean))];
  const todayQueue = state.registrations.filter((item) => item.createdAt === todayString() && !["已完成", "取消"].includes(item.status)).length;
  const pendingRx = state.prescriptionRecords.filter((item) => ["草稿", "待审核", "退回"].includes(item.status)).length;
  return `
    <aside class="patient-rail">
      <section class="patient-rail-card">
        <div class="stats-grid">
          <div class="stat"><strong>${visiblePatients.length}</strong><span>可见患者</span></div>
          <div class="stat"><strong>${todayQueue}</strong><span>今日候诊</span></div>
          <div class="stat"><strong>${pendingRx}</strong><span>处方待办</span></div>
        </div>
      </section>
      <section class="patient-rail-card toolbar">
        <div class="patient-search-head">
          <strong>患者检索</strong>
          <span>${visiblePatients.length} 人</span>
        </div>
        <input class="input patient-search-input" data-search="query" value="${escapeAttr(state.query)}" placeholder="输入编号、姓名、诊断或主诉" />
        ${renderTagFilterChips(tags)}
        <div class="toolbar-row patient-actions-row">
          ${state.module === "patients" && can(user, "patient:create") ? `<button class="btn primary" data-action="add-patient">新建患者</button>` : ""}
          <label class="btn file-label">导入表格<input type="file" accept=".csv,text/csv" data-csv="import" /></label>
        </div>
        <div class="toolbar-row">
          ${can(user, "export:data") ? `<button class="btn ghost" data-action="copy-json">复制备份数据</button>` : ""}
          <button class="btn ghost" data-action="reset-demo">恢复演示数据</button>
        </div>
      </section>
      <div class="patient-list">
        ${visiblePatients.length ? visiblePatients.map(renderPatientCard).join("") : `<p class="empty">没有匹配或可访问的患者。</p>`}
      </div>
    </aside>
  `;
}

function renderTagFilterChips(tags) {
  const visibleTags = tags.slice(0, 6);
  return `
    <div class="tag-filter-row" aria-label="患者标签筛选">
      <button class="tag-chip ${state.tagFilter ? "" : "active"}" data-action="tag-filter" data-tag="">全部</button>
      ${visibleTags.map((tag) => `<button class="tag-chip ${state.tagFilter === tag ? "active" : ""}" data-action="tag-filter" data-tag="${escapeAttr(tag)}">${escapeHtml(shortTag(tag))}</button>`).join("")}
    </div>
  `;
}

function displayChineseCode(value) {
  let text = String(value || "").trim();
  while (/^[A-Za-z]+-?/.test(text)) {
    text = text.replace(/^[A-Za-z]+-?/, "");
  }
  return text || "未生成";
}

function displayPatientCode(value) {
  return `编号：${displayChineseCode(value)}`;
}

function displayQueueNo(value) {
  return `队列号：${displayChineseCode(value)}`;
}

function renderPatientCreateModal(user) {
  return `
    <div class="modal-backdrop patient-create-modal" role="dialog" aria-modal="true" aria-label="新建患者">
      ${renderPatientCreateForm(user)}
    </div>
  `;
}

function renderPatientCreateForm(user) {
  const draft = state.patientCreateDraft;
  const enabledDepartments = state.departments.filter((department) => department.enabled);
  return `
    <section class="patient-create-card">
      <div class="patient-create-head">
        <div>
          <strong>新建患者</strong>
          <span>保存后才建档</span>
        </div>
        <button class="modal-close" data-action="cancel-patient-create" title="关闭">关闭</button>
      </div>
      <div class="patient-create-grid">
        <input class="input" data-patient-create="nameAlias" value="${escapeAttr(draft.nameAlias || "")}" placeholder="患者别名/姓名" />
        <input class="input" data-patient-create="contact" value="${escapeAttr(draft.contact || "")}" placeholder="联系方式尾号" />
        <input class="input" data-patient-create="age" type="number" value="${escapeAttr(draft.age || "")}" placeholder="年龄" />
        <select class="select" data-patient-create="gender">
          ${["未填", "女", "男"].map((item) => `<option value="${escapeAttr(item)}" ${draft.gender === item ? "selected" : ""}>${escapeHtml(item)}</option>`).join("")}
        </select>
        <select class="select" data-patient-create="departmentId">
          ${enabledDepartments.map((department) => `<option value="${escapeAttr(department.id)}" ${draft.departmentId === department.id ? "selected" : ""}>${escapeHtml(department.name)}</option>`).join("")}
        </select>
        <select class="select" data-patient-create="ownerUserId">
          ${doctorOptions().map(([id, label]) => `<option value="${escapeAttr(id)}" ${draft.ownerUserId === id ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
        </select>
        <input class="input full" data-patient-create="tag" value="${escapeAttr(draft.tag || "")}" placeholder="患者标签，如 初诊-待评估" />
        <input class="input full" data-patient-create="source" value="${escapeAttr(draft.source || "")}" placeholder="来源，如 门诊建档/导医台" />
      </div>
      <div class="button-row">
        <button class="btn primary" data-action="save-patient-create">保存建档</button>
        <button class="btn" data-action="cancel-patient-create">取消</button>
      </div>
    </section>
  `;
}

function renderCrudModal(user) {
  const modal = state.crudModal;
  if (!modal) return "";
  const patient = getSelectedPatient();
  if (modal.type === "entry") {
    const config = entryModalConfig(modal.arrayName);
    const item = patient?.[modal.arrayName]?.[Number(modal.index)];
    if (!config || !item) return "";
    const canEdit = canEditPatientArray(user, modal.arrayName, patient);
    return renderCrudModalShell({
      title: `${config.title}编辑`,
      subtitle: `${patient.nameAlias} · ${displayPatientCode(patient.id)}`,
      body: config.renderer(item, Number(modal.index), modal.arrayName, !canEdit),
      footer: `<button class="btn primary" data-action="close-crud-modal">保存并关闭</button>`
    });
  }
  if (modal.type === "patientBasic") {
    const targetPatient = findPatient(modal.patientId) || patient;
    if (!targetPatient) return "";
    const editable = can(user, "patient:basic") && canAccessPatient(user, targetPatient, "basic");
    return renderCrudModalShell({
      title: "患者基本信息",
      subtitle: `${targetPatient.nameAlias} · ${displayPatientCode(targetPatient.id)}`,
      body: renderBasicEditor(targetPatient, !editable),
      footer: `<button class="btn primary" data-action="close-crud-modal">保存并关闭</button>`
    });
  }
  if (modal.type === "order") {
    const order = state.serviceOrders.find((item) => item.id === modal.id);
    if (!order) return "";
    const canEdit = can(user, "order:create") && canAccessPatient(user, findPatient(order.patientId), "basic");
    const canRefund = can(user, "sales:view");
    return renderCrudModalShell({
      title: "项目/疗程编辑",
      subtitle: `${patientNameById(order.patientId)} · ${order.id}`,
      body: renderOrderEditor(order, canEdit, canRefund),
      footer: `<button class="btn primary" data-action="close-crud-modal">保存并关闭</button>`
    });
  }
  if (modal.type === "prescription") {
    const record = state.prescriptionRecords.find((item) => item.id === modal.id);
    if (!record) return "";
    const owner = findPatient(record.patientId);
    const canCreate = can(user, "prescription:create") && canAccessPatient(user, owner, "record");
    const canReview = can(user, "prescription:review");
    return renderCrudModalShell({
      title: "处方记录编辑",
      subtitle: `${patientNameById(record.patientId)} · ${record.id}`,
      body: renderPrescriptionEditor(record, canCreate, canReview),
      footer: `<button class="btn primary" data-action="close-crud-modal">保存并关闭</button>`
    });
  }
  if (modal.type === "user") {
    const targetUser = state.users.find((item) => item.id === modal.id);
    if (!targetUser) return "";
    const editable = can(user, "settings:manage");
    return renderCrudModalShell({
      title: "账号权限编辑",
      subtitle: `${targetUser.loginName || targetUser.name} · ${roleName(targetUser.role)}`,
      body: renderUserPermissionCard(targetUser, editable),
      footer: `<button class="btn" data-action="close-crud-modal">关闭</button>`
    });
  }
  if (modal.type === "newUser") {
    return renderCrudModalShell({
      title: "新建账号",
      subtitle: "填写账号、角色、科室和可见界面后保存",
      body: renderNewUserCard(),
      footer: `<button class="btn" data-action="close-crud-modal">关闭</button>`
    });
  }
  if (modal.type === "role") {
    const role = state.roles.find((item) => item.id === modal.id);
    if (!role) return "";
    const editable = can(user, "settings:manage");
    return renderCrudModalShell({
      title: "角色权限编辑",
      subtitle: `${role.name} · ${roleUserCount(role.id)} 个账号使用`,
      body: renderRoleEditor(role, editable),
      footer: `<button class="btn primary" data-action="close-crud-modal">保存并关闭</button>`
    });
  }
  if (modal.type === "department") {
    const department = state.departments.find((item) => item.id === modal.id);
    if (!department) return "";
    const editable = can(user, "settings:manage");
    return renderCrudModalShell({
      title: "科室字典编辑",
      subtitle: `${department.name} · ${department.type}`,
      body: renderDepartmentEditor(department, editable),
      footer: `<button class="btn primary" data-action="close-crud-modal">保存并关闭</button>`
    });
  }
  return "";
}

function renderCrudModalShell({ title, subtitle, body, footer = "" }) {
  return `
    <div class="modal-backdrop crud-modal-backdrop" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}">
      <section class="crud-modal-card">
        <header class="crud-modal-head">
          <div>
            <strong>${escapeHtml(title)}</strong>
            <span>${escapeHtml(subtitle || "编辑后自动保存，关闭弹窗返回列表。")}</span>
          </div>
          <button type="button" class="modal-close" data-action="close-crud-modal" title="关闭">关闭</button>
        </header>
        <div class="crud-modal-body">${body}</div>
        <footer class="crud-modal-footer">
          ${footer}
        </footer>
      </section>
    </div>
  `;
}

function entryModalConfig(arrayName) {
  const config = {
    examReports: { title: "检查报告", renderer: renderExamEntry },
    imageTimeline: { title: "照片记录", renderer: renderImageEntry },
    treatmentPlans: { title: "治疗记录", renderer: renderTreatmentEntry },
    phototherapySessions: { title: "光疗剂量", renderer: renderPhototherapyEntry },
    followUps: { title: "回访记录", renderer: renderFollowEntry }
  };
  return config[arrayName];
}

function renderPatientCard(patient) {
  const analysis = assessPatient(patient);
  const registration = latestRegistration(patient.id);
  return `
    <button class="patient-card ${patient.id === state.selectedId ? "active" : ""}" data-action="select" data-id="${escapeAttr(patient.id)}">
      <span class="patient-card-avatar">${escapeHtml(patient.nameAlias.slice(0, 1) || "患")}</span>
      <div class="patient-card-main">
        <strong>${escapeHtml(patient.nameAlias)}</strong>
        <span>${escapeHtml(displayPatientCode(patient.id))}</span>
        <div class="patient-card-tags">
          <em class="${riskClassName(analysis.riskLevel)}">${analysis.riskLevel}</em>
          <em>${escapeHtml(registration?.status || patient.status || "未挂号")}</em>
        </div>
      </div>
      <div class="patient-card-side">
        <span>${escapeHtml(departmentName(patient.departmentId))}</span>
        <span>${escapeHtml(patient.doctor || userName(patient.ownerUserId) || "未分配")}</span>
      </div>
    </button>
  `;
}

function renderModule(user) {
  if (state.module === "guide") return renderGuideDesk(user);
  if (state.module === "director") return can(user, "dashboard:view") ? renderDirectorDashboard(user) : renderDenied("当前账号不能查看院长看板。");
  if (state.module === "settings") return canAccessSettings(user) ? renderSettings(user) : renderDenied("当前账号不能查看权限管理。");
  if (state.module === "audit") return can(user, "audit:view") ? renderAuditLog() : renderDenied("当前账号不能查看审计日志。");
  return renderPatientWorkspace(user);
}

function renderGuideDesk(user) {
  const enabledDepartments = state.departments.filter((department) => department.enabled);
  return `
    <section class="content-grid guide-layout">
      <div class="panel guide-register-panel">
        <div class="panel-inner">
          <div class="entry-head">
            <div>
              <span class="section-eyebrow">分诊入口</span>
              <h3>快速挂号</h3>
              <p class="hint">先查重，再建档挂号，减少重复患者记录。</p>
            </div>
            <span class="badge">挂号 + 排队</span>
          </div>
          ${can(user, "registration:create") ? `
            <div class="form-grid">
              ${draftField("患者别名", "nameAlias")}
              ${draftField("联系方式/尾号", "contact")}
              ${draftField("年龄", "age", "number")}
              ${draftSelect("性别", "gender", ["未填", "女", "男"])}
              ${draftField("来源", "source")}
              ${draftSelect("科室", "departmentId", enabledDepartments.map((department) => [department.id, department.name]))}
              ${draftSelect("医生", "doctorUserId", doctorOptions())}
            </div>
            <div class="field top-gap">
              <label>分诊备注</label>
              <textarea class="textarea short" data-draft="note">${escapeHtml(state.registrationDraft.note || "")}</textarea>
            </div>
            <div class="button-row">
              <button class="btn primary" data-action="register-patient">查重并挂号</button>
              <span class="hint" data-guide-doctor-hint>${escapeHtml(guideDoctorHint())}</span>
            </div>
          ` : renderDenied("当前角色不能进行挂号。")}
        </div>
      </div>
      <aside class="side-stack guide-side">
        <div class="panel guide-routing-card">
          <div class="panel-inner">
            <span class="section-eyebrow">分诊路径</span>
            <h3>患者流转</h3>
            <div class="flow-rail">
              <span>建档</span>
              <span>挂号</span>
              <span>候诊</span>
              <span>接诊</span>
            </div>
          </div>
        </div>
        ${renderComplianceNote()}
      </aside>
    </section>
    <section class="panel">
      <div class="panel-inner">
        <div class="entry-head">
          <div>
            <span class="section-eyebrow">实时队列</span>
            <h3>候诊队列</h3>
          </div>
          <select class="select small-select" data-filter="queue">
            <option value="">全部状态</option>
            ${["待分诊", "候诊中", "接诊中", "已完成", "转科", "取消"].map((status) => `<option ${state.queueFilter === status ? "selected" : ""}>${status}</option>`).join("")}
          </select>
        </div>
        <div class="queue-list">
          ${getQueueItems(user).map((item) => renderQueueCard(item, user)).join("") || `<p class="empty">暂无候诊记录。</p>`}
        </div>
      </div>
    </section>
  `;
}

function renderQueueCard(registration, user) {
  const patient = findPatient(registration.patientId);
  const editable = can(user, "registration:update");
  return `
    <article class="queue-card">
      <div>
        <strong>${escapeHtml(displayQueueNo(registration.queueNo))} · ${escapeHtml(patient?.nameAlias || "相关患者")}</strong>
        <p class="hint">${escapeHtml(patient?.age || "")}岁 · ${escapeHtml(patient?.gender || "")} · ${escapeHtml(registration.note || "无备注")}</p>
      </div>
      <div class="queue-controls">
        <select class="select" data-state-array="registrations" data-id="${escapeAttr(registration.id)}" data-field="departmentId" ${editable ? "" : "disabled"}>
          ${state.departments.map((department) => `<option value="${escapeAttr(department.id)}" ${registration.departmentId === department.id ? "selected" : ""}>${escapeHtml(department.name)}</option>`).join("")}
        </select>
        <select class="select" data-state-array="registrations" data-id="${escapeAttr(registration.id)}" data-field="doctorUserId" ${editable ? "" : "disabled"}>
          <option value="">暂不指定</option>
          ${doctorOptions().map(([id, label]) => `<option value="${escapeAttr(id)}" ${registration.doctorUserId === id ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
        </select>
        <span class="status-pill">${escapeHtml(registration.status)}</span>
      </div>
      <div class="button-row">
        ${queueButton(registration, "接诊中", "接诊", user)}
        ${queueButton(registration, "已完成", "完成", user)}
        ${queueButton(registration, "转科", "转科", user)}
        ${queueButton(registration, "取消", "取消", user)}
      </div>
    </article>
  `;
}

function renderPatientWorkspace(user) {
  const patient = getSelectedPatient();
  if (!patient) return renderEmptyWorkspace();
  if (!canAccessPatient(user, patient, "basic")) return renderDenied("当前账号不能查看该患者。");
  const visibleTabs = getVisibleTabs(user, patient);
  if (!visibleTabs.some((tab) => tab.id === state.activeTab)) state.activeTab = visibleTabs[0]?.id || "basic";
  const analysis = assessPatient(patient);
  return `
    <section class="topbar" data-live-header>
      ${renderPatientHeader(patient)}
      ${renderRiskCard(analysis)}
    </section>
    <nav class="tabs" aria-label="患者工作台模块">
      ${visibleTabs.map((tab) => `<button class="tab ${state.activeTab === tab.id ? "active" : ""}" data-action="tab" data-tab="${tab.id}">${tab.label}</button>`).join("")}
    </nav>
    <section class="content-grid ${state.activeTab === "specialty" ? "specialty-tab-layout" : ""}">
      <div class="panel">
        <div class="panel-inner">
          ${renderActiveTab(patient, analysis, user)}
        </div>
      </div>
      <aside class="side-stack">
        ${renderPatientFlowCard(patient)}
        ${renderFollowUpReminder(analysis)}
        ${renderComplianceNote()}
      </aside>
    </section>
  `;
}

function renderPatientHeader(patient) {
  return `
    <div class="panel">
      <div class="panel-inner patient-title">
        <div>
          <h2>${escapeHtml(patient.nameAlias)} <span class="badge">${escapeHtml(displayPatientCode(patient.id))}</span></h2>
          <p class="hint">${escapeHtml(patient.age)}岁 · ${escapeHtml(patient.gender)} · ${escapeHtml(departmentName(patient.departmentId))} · ${escapeHtml(patient.doctor || userName(patient.ownerUserId) || "未分配")}</p>
        </div>
        <span class="badge">${escapeHtml(patient.status)} / ${escapeHtml(patient.tag)}</span>
      </div>
    </div>
  `;
}

function renderRiskCard(analysis) {
  return `
    <div class="panel risk-card">
      <div class="panel-inner risk-grid">
        <div>
          <div class="risk-number ${riskClassName(analysis.riskLevel)}">${analysis.riskLevel}</div>
          <div class="risk-label">流失风险</div>
        </div>
        <div>
          <div class="risk-number">${analysis.riskScore}</div>
          <div class="risk-label">风险分</div>
        </div>
        <div>
          <div class="risk-number">${analysis.conversionRate}%</div>
          <div class="risk-label">成交/复诊概率</div>
        </div>
      </div>
    </div>
  `;
}

function renderActiveTab(patient, analysis, user) {
  if (state.activeTab === "basic") return renderBasicForm(patient, user);
  if (state.activeTab === "record") return can(user, "record:read") ? renderRecordForm(patient, user) : renderDenied("当前角色不能查看完整病历。");
  if (state.activeTab === "specialty") return renderSpecialtyAssessment(patient, user);
  if (state.activeTab === "exam") return renderEntryList(patient, "examReports", "E", "检查报告", renderExamEntry, user);
  if (state.activeTab === "images") return renderEntryList(patient, "imageTimeline", "IMG", "照片时间轴", renderImageEntry, user);
  if (state.activeTab === "treatment") return renderEntryList(patient, "treatmentPlans", "T", "治疗记录", renderTreatmentEntry, user);
  if (state.activeTab === "orders") return renderOrders(patient, user);
  if (state.activeTab === "prescriptions") return renderPrescriptions(patient, user);
  if (state.activeTab === "follow") return renderEntryList(patient, "followUps", "F", "回访记录", renderFollowEntry, user);
  return renderAiPanel(patient, analysis, user);
}

function renderBasicForm(patient, user) {
  const editable = can(user, "patient:basic") && canAccessPatient(user, patient, "basic");
  return `
    <div class="entry-head">
      <h3>基本信息</h3>
      <button class="btn action-btn ${editable ? "primary" : ""}" data-action="open-basic-modal">${editable ? "编辑基本信息" : "查看详情"}</button>
    </div>
    <div class="crud-detail-grid">
      ${detailItem("匿名编号", patient.id)}
      ${detailItem("患者别名", patient.nameAlias)}
      ${detailItem("年龄/性别", `${patient.age || "未填"}岁 · ${patient.gender || "未填"}`)}
      ${detailItem("标签", patient.tag)}
      ${detailItem("来源", patient.source)}
      ${detailItem("状态", patient.status)}
      ${detailItem("归属科室", departmentName(patient.departmentId))}
      ${detailItem("归属医生", patient.doctor || userName(patient.ownerUserId) || "未分配")}
      ${detailItem("建档日期", patient.createdAt)}
      ${detailItem("联系方式", patient.contact || "未填写")}
    </div>
  `;
}

function renderBasicEditor(patient, disabled = false) {
  return `
    <div class="form-grid">
      ${field("匿名编号", "id", patient.id, "text", disabled)}
      ${field("患者别名", "nameAlias", patient.nameAlias, "text", disabled)}
      ${field("年龄", "age", patient.age, "number", disabled)}
      ${selectField("性别", "gender", patient.gender, ["未填", "女", "男"], disabled)}
      ${field("标签", "tag", patient.tag, "text", disabled)}
      ${field("来源", "source", patient.source, "text", disabled)}
      ${field("状态", "status", patient.status, "text", disabled)}
      ${selectField("归属科室", "departmentId", patient.departmentId, state.departments.map((department) => [department.id, department.name]), disabled)}
      ${selectField("归属医生", "ownerUserId", patient.ownerUserId, doctorOptions(), disabled)}
      ${field("建档日期", "createdAt", patient.createdAt, "date", disabled)}
      ${field("联系方式（演示建议脱敏）", "contact", patient.contact, "text", disabled)}
    </div>
  `;
}

function detailItem(label, value) {
  return `
    <div class="detail-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value ?? "未填写")}</strong>
    </div>
  `;
}

function renderSpecialtyAssessment(patient, user) {
  const metrics = calculateSpecialtyMetrics(patient);
  const canEdit = canEditSpecialty(user, patient);
  return `
    <section class="specialty-workbench">
      <div class="entry-head specialty-head">
        <div>
          <h3>白癜风专科评估</h3>
          <p class="hint">部位图、体表面积、白斑评分、照片对比、光疗剂量和疗效趋势在这里统一管理。</p>
        </div>
        ${canEdit ? `<button class="btn primary" data-action="save-vasi-snapshot">保存本次评分</button>` : ""}
      </div>
      ${renderSpecialtyMetrics(metrics)}
      <div class="specialty-grid">
        ${renderBodyMap(patient, canEdit, metrics)}
        ${renderVasiCalculator(patient, canEdit, metrics)}
      </div>
      ${renderPhotoComparison(patient, user, canEdit)}
      ${renderPhototherapyDosePanel(patient, user)}
      ${renderEfficacyTrend(patient, metrics)}
    </section>
  `;
}

function renderSpecialtyMetrics(metrics) {
  const trendClass = Number(metrics.vasiChange) <= 0 ? "risk-low" : "risk-mid";
  return `
    <div class="specialty-metrics">
      <div class="stat"><strong>${metrics.currentBsa}%</strong><span>当前体表面积</span></div>
      <div class="stat"><strong>${metrics.currentVasi}</strong><span>当前白斑评分</span></div>
      <div class="stat"><strong>${metrics.activeRegionCount}</strong><span>受累部位</span></div>
      <div class="stat"><strong class="${trendClass}">${metrics.vasiChange > 0 ? "+" : ""}${metrics.vasiChange}</strong><span>较基线评分</span></div>
      <div class="stat"><strong>${metrics.phototherapyCount}</strong><span>光疗次数</span></div>
      <div class="stat"><strong>${metrics.latestDose || "未填"}</strong><span>最近剂量</span></div>
    </div>
  `;
}

function renderBodyMap(patient, canEdit, metrics) {
  const regions = patient.specialtyAssessment?.bodyRegions || [];
  return `
    <section class="specialty-card">
      <div class="entry-head">
        <div>
          <h4>部位图</h4>
          <p class="hint">点击部位后，在右侧填写体表面积和脱色比例。</p>
        </div>
        <span class="badge">${metrics.activeRegionCount} 个部位</span>
      </div>
      <div class="body-map-layout">
        <div class="body-map-figure" aria-label="白癜风部位图">
          <div class="body-silhouette"></div>
          ${BODY_REGION_DEFINITIONS.map((definition) => {
            const region = regions.find((item) => item.id === definition.id) || {};
            const active = region.active === true || Number(region.affectedBsaPercent) > 0;
            return `
              <button class="body-region region-${escapeAttr(definition.id)} ${active ? "active" : ""}" data-action="toggle-body-region" data-region="${escapeAttr(definition.id)}" ${canEdit ? "" : "disabled"} title="${escapeAttr(`${definition.label}：${definition.hint}`)}">
                <strong>${escapeHtml(definition.short)}</strong>
                <span>${escapeHtml(definition.label)}</span>
              </button>
            `;
          }).join("")}
        </div>
        <div class="body-map-legend">
          ${metrics.currentRows.length ? metrics.currentRows.map((row) => `
            <div><strong>${escapeHtml(row.label)}</strong><span>体表面积 ${row.affectedBsaPercent}% · 脱色${row.depigmentationPercent}% · 白斑评分 ${row.vasiScore}</span></div>
          `).join("") : `<p class="empty">尚未标记受累部位。</p>`}
        </div>
      </div>
    </section>
  `;
}

function renderVasiCalculator(patient, canEdit, metrics) {
  const regions = patient.specialtyAssessment?.bodyRegions || [];
  return `
    <section class="specialty-card">
      <div class="entry-head">
        <div>
          <h4>面积与白斑评分计算</h4>
          <p class="hint">白斑评分 = 各部位体表面积百分比 × 残余脱色比例后求和。</p>
        </div>
        <span class="status-pill">体表面积 ${metrics.currentBsa}% / 白斑评分 ${metrics.currentVasi}</span>
      </div>
      <div class="table-wrap">
        <table class="data-table vasi-table">
          <thead>
            <tr><th>部位</th><th>体表面积</th><th>脱色比例</th><th>活动度</th><th>白斑评分</th><th>备注</th></tr>
          </thead>
          <tbody>
            ${regions.map((region, index) => renderVasiRow(region, index, !canEdit)).join("")}
          </tbody>
        </table>
      </div>
      <div class="field">
        <label>趋势备注</label>
        <textarea class="textarea short" data-field="specialtyAssessment.trendNote" ${canEdit ? "" : "disabled"}>${escapeHtml(patient.specialtyAssessment?.trendNote || "")}</textarea>
      </div>
    </section>
  `;
}

function renderVasiRow(region, index, disabled) {
  const definition = BODY_REGION_DEFINITIONS.find((item) => item.id === region.id) || {};
  const affected = Number(region.affectedBsaPercent) || 0;
  const depigmentation = Number(region.depigmentationPercent) || 100;
  const vasi = affected > 0 ? (affected * depigmentation / 100).toFixed(2).replace(/\.?0+$/, "") : "0";
  return `
    <tr class="${region.active || affected > 0 ? "selected" : ""}">
      <td><strong>${escapeHtml(definition.label || region.id)}</strong><br><span class="hint">${escapeHtml(definition.hint || "")}</span></td>
      <td><input class="input compact-input" type="number" min="0" max="100" step="0.1" data-field="specialtyAssessment.bodyRegions.${index}.affectedBsaPercent" value="${escapeAttr(region.affectedBsaPercent ?? "")}" ${disabled ? "disabled" : ""} /></td>
      <td>
        <select class="select compact-input" data-field="specialtyAssessment.bodyRegions.${index}.depigmentationPercent" ${disabled ? "disabled" : ""}>
          ${VASI_DEPIGMENTATION_OPTIONS.map((value) => `<option value="${value}" ${Number(region.depigmentationPercent) === value ? "selected" : ""}>${value}%</option>`).join("")}
        </select>
      </td>
      <td>
        <select class="select compact-input" data-field="specialtyAssessment.bodyRegions.${index}.activity" ${disabled ? "disabled" : ""}>
          ${["待评估", "进展", "稳定", "复色", "炎症反应"].map((value) => `<option value="${escapeAttr(value)}" ${region.activity === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}
        </select>
      </td>
      <td><strong>${vasi}</strong></td>
      <td><input class="input" data-field="specialtyAssessment.bodyRegions.${index}.note" value="${escapeAttr(region.note || "")}" ${disabled ? "disabled" : ""} /></td>
    </tr>
  `;
}

function renderPhotoComparison(patient, user, canEdit) {
  if (!can(user, "image:view") || !canAccessPatient(user, patient, "basic")) return renderDenied("当前角色不能查看照片对比。");
  const photos = patient.imageTimeline || [];
  const compare = patient.specialtyAssessment?.photoCompare || {};
  const before = photos.find((photo) => photo.id === compare.beforePhotoId) || photos[1] || photos[0];
  const after = photos.find((photo) => photo.id === compare.afterPhotoId) || photos[0];
  return `
    <section class="specialty-card">
      <div class="entry-head">
        <div>
          <h4>照片对比</h4>
          <p class="hint">选择基线照片和复诊照片，对比部位、面积占比和医生确认状态。</p>
        </div>
        <button class="btn" data-action="tab" data-tab="images">进入照片时间轴</button>
      </div>
      ${photos.length ? `
        <div class="photo-compare-selects">
          ${photoCompareSelect("基线照片", "specialtyAssessment.photoCompare.beforePhotoId", compare.beforePhotoId, photos, !canEdit)}
          ${photoCompareSelect("复诊照片", "specialtyAssessment.photoCompare.afterPhotoId", compare.afterPhotoId, photos, !canEdit)}
        </div>
        <div class="photo-compare-grid">
          ${renderComparePhoto(before, "基线")}
          ${renderComparePhoto(after, "复诊")}
        </div>
      ` : `<p class="empty">暂无照片。请先在病历照片或照片时间轴上传患处照片。</p>`}
    </section>
  `;
}

function photoCompareSelect(label, path, value, photos, disabled) {
  return `
    <div class="field">
      <label>${escapeHtml(label)}</label>
      <select class="select" data-field="${escapeAttr(path)}" ${disabled ? "disabled" : ""}>
        <option value="">自动选择</option>
        ${photos.map((photo) => `<option value="${escapeAttr(photo.id)}" ${value === photo.id ? "selected" : ""}>${escapeHtml([photo.date, photo.bodySite, photo.mode].filter(Boolean).join(" · ") || photo.id)}</option>`).join("")}
      </select>
    </div>
  `;
}

function renderComparePhoto(photo, title) {
  if (!photo) return `<article class="compare-photo"><div class="photo-placeholder large">暂无${escapeHtml(title)}照片</div></article>`;
  return `
    <article class="compare-photo">
      <strong>${escapeHtml(title)} · ${escapeHtml(photo.date || "未填日期")}</strong>
      ${photo.imageDataUrl ? `<img src="${escapeAttr(photo.imageDataUrl)}" alt="${escapeAttr(photo.bodySite || title)}" />` : `<div class="photo-placeholder large">仅有记录</div>`}
      <p>${escapeHtml([photo.bodySite, photo.mode, photo.doctorConfirmed].filter(Boolean).join(" · ") || "照片信息待完善")}</p>
      <span class="hint">面积占比：${escapeHtml(photo.aiAreaPercent || "未记录")}% · ${escapeHtml(photo.note || "暂无说明")}</span>
    </article>
  `;
}

function renderPhototherapyDosePanel(patient, user) {
  const canEdit = canEditPatientArray(user, "phototherapySessions", patient);
  return `
    <section class="specialty-card">
      ${renderEntryList(patient, "phototherapySessions", "PT", "光疗剂量记录", renderPhototherapyEntry, user)}
      <p class="hint">本模块只记录医生/治疗师确认后的执行剂量、反应和下次计划，不自动推荐剂量。</p>
    </section>
  `;
}

function renderPhototherapyEntry(item, index, arrayName, disabled) {
  return `
    <div class="entry-card phototherapy-entry">
      ${entryHead("光疗", index, arrayName, disabled)}
      <div class="form-grid">
        ${entryField("日期", arrayName, index, "date", item.date, "date", disabled)}
        ${entryField("设备/方式", arrayName, index, "device", item.device, "text", disabled)}
        ${entryField("照射部位", arrayName, index, "bodySite", item.bodySite, "text", disabled)}
        ${entryField("剂量(mJ/cm2)", arrayName, index, "doseMj", item.doseMj, "number", disabled)}
        ${entryField("时长(秒)", arrayName, index, "durationSeconds", item.durationSeconds, "number", disabled)}
        ${entrySelect("红斑/反应", arrayName, index, "erythema", item.erythema, ["未记录", "无明显不适", "轻微红斑", "明显红斑", "灼痛", "水疱"], disabled)}
        ${entrySelect("执行人", arrayName, index, "operatorUserId", item.operatorUserId, [["", "未选择"], ...state.users.filter((user) => user.enabled).map((user) => [user.id, user.name])], disabled)}
      </div>
      ${entryArea("下次剂量计划/医嘱", arrayName, index, "nextDosePlan", item.nextDosePlan, disabled)}
      ${entryArea("备注", arrayName, index, "note", item.note, disabled)}
    </div>
  `;
}

function renderEfficacyTrend(patient, metrics) {
  const trendRows = buildTrendRows(patient, metrics);
  return `
    <section class="specialty-card">
      <div class="entry-head">
        <div>
          <h4>疗效趋势</h4>
          <p class="hint">汇总白斑评分历史、照片面积和光疗剂量，帮助复诊时看变化。</p>
        </div>
        <span class="badge">${trendRows.length} 个趋势点</span>
      </div>
      ${trendRows.length ? `
        <div class="trend-board">
          ${trendRows.map((row) => renderTrendPoint(row)).join("")}
        </div>
      ` : `<p class="empty">暂无趋势数据。保存白斑评分或记录照片面积后会显示。</p>`}
    </section>
  `;
}

function buildTrendRows(patient, metrics) {
  const vasiRows = metrics.history.map((item) => ({
    date: item.date,
    label: "白斑评分",
    value: Number(item.vasiScore) || 0,
    note: item.note || `${item.regionCount || 0}个部位`
  }));
  const currentExists = vasiRows.some((row) => row.date === todayString());
  if (!currentExists && (metrics.currentVasi || metrics.currentBsa)) {
    vasiRows.push({ date: todayString(), label: "当前白斑评分", value: metrics.currentVasi, note: `体表面积 ${metrics.currentBsa}%` });
  }
  const photoRows = metrics.photoAreas.map((item) => ({
    date: item.date,
    label: "照片面积",
    value: item.value,
    note: item.label
  }));
  return [...vasiRows, ...photoRows]
    .filter((row) => row.date)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(-8);
}

function renderTrendPoint(row) {
  const width = Math.max(6, Math.min(100, Number(row.value) * 12));
  return `
    <article class="trend-point">
      <span>${escapeHtml(row.date)}</span>
      <strong>${escapeHtml(row.label)} ${escapeHtml(row.value)}</strong>
      <div class="trend-bar"><i style="width:${width}%"></i></div>
      <em>${escapeHtml(row.note || "")}</em>
    </article>
  `;
}

function renderRecordForm(patient, user) {
  const quality = getRecordQuality(patient);
  const locked = patient.medicalRecord.emrStatus === "已归档";
  const disabled = locked || !can(user, "record:write") || !canAccessPatient(user, patient, "record");
  const record = patient.medicalRecord;
  return `
    ${renderRecordManagement(patient, user, quality)}
    ${renderRecordPhotoSection(patient, user)}
    <h3>门诊病历</h3>
    <div class="form-grid one">
      ${areaField("主诉", "medicalRecord.chiefComplaint", record.chiefComplaint, disabled)}
      ${areaField("现病史", "medicalRecord.presentIllness", record.presentIllness, disabled)}
      ${areaField("既往史", "medicalRecord.pastHistory", record.pastHistory, disabled)}
    </div>
    ${renderVitiligoTemplate(record, disabled)}
    <h3>诊断与处理</h3>
    <div class="form-grid one">
      ${areaField("专科/辅助检查", "medicalRecord.exam", record.exam, disabled)}
      ${field("诊断", "medicalRecord.diagnosis", record.diagnosis, "text", disabled)}
      ${areaField("处理意见", "medicalRecord.plan", record.plan, disabled)}
    </div>
    ${renderRecordVersions(record)}
  `;
}

function renderRecordManagement(patient, user, quality) {
  const record = patient.medicalRecord;
  const canWriteRecord = can(user, "record:write") && canAccessPatient(user, patient, "record");
  const signedName = userName(record.signedBy) || "未签名";
  return `
    <section class="record-management">
      <div class="record-status-grid">
        <div class="record-status-card">
          <span>病历状态</span>
          <strong>${escapeHtml(record.emrStatus || "草稿")}</strong>
        </div>
        <div class="record-status-card">
          <span>版本</span>
          <strong>V${escapeHtml(record.version || 1)}</strong>
        </div>
        <div class="record-status-card">
          <span>质控</span>
          <strong class="${quality.status === "合格" ? "risk-low" : quality.status === "待完善" ? "risk-mid" : "risk-high"}">${escapeHtml(quality.status)} · ${quality.score}分</strong>
        </div>
        <div class="record-status-card">
          <span>医生签名</span>
          <strong>${escapeHtml(signedName)}</strong>
        </div>
      </div>
      <div class="record-meta">
        <span>病历号：${escapeHtml(record.recordNo || patient.id)}</span>
        <span>提交：${escapeHtml(record.submittedAt || "未提交")}</span>
        <span>签名：${escapeHtml(record.signedAt || "未签名")}</span>
        <span>归档：${escapeHtml(record.archivedAt || "未归档")}</span>
      </div>
      ${renderRecordQuality(quality)}
      <div class="button-row">
        ${canWriteRecord && ["草稿", "修订中"].includes(record.emrStatus) ? `<button class="btn primary" data-action="record-action" data-record-action="submit">提交病历</button>` : ""}
        ${canWriteRecord && user.role === "doctor" && ["已提交", "修订中"].includes(record.emrStatus) ? `<button class="btn primary" data-action="record-action" data-record-action="sign">医生签名</button>` : ""}
        ${canWriteRecord && record.signedBy && record.emrStatus !== "已归档" ? `<button class="btn primary" data-action="record-action" data-record-action="archive">归档锁定</button>` : ""}
        ${canWriteRecord && record.emrStatus === "已归档" ? `<button class="btn" data-action="record-action" data-record-action="revise" data-note="归档后修订">发起修订</button>` : ""}
        <button class="btn" data-action="copy-record-text">复制病历文本</button>
        <button class="btn" data-action="copy-record-json">复制病历数据</button>
        <button class="btn" data-action="print-record">打印病历</button>
      </div>
    </section>
  `;
}

function renderRecordPhotoSection(patient, user) {
  const canViewPhotos = can(user, "image:view") && canAccessPatient(user, patient, "basic");
  const canUploadPhotos = canEditPatientArray(user, "imageTimeline", patient);
  if (!canViewPhotos && !canUploadPhotos) return "";
  const photos = patient.imageTimeline || [];
  const recentPhotos = photos.slice(0, 6);
  return `
    <section class="record-photo-section">
      <div class="entry-head">
        <div>
          <h3>病历照片</h3>
          <p class="hint">新增病历时可上传患处照片，记录会同步进入照片时间轴。</p>
        </div>
        ${canViewPhotos ? `<button class="btn" data-action="tab" data-tab="images">查看完整照片时间轴</button>` : ""}
      </div>
      ${canUploadPhotos ? renderRecordPhotoUploadBox(patient) : ""}
      ${canViewPhotos ? renderRecordPhotoHistory(recentPhotos) : renderDenied("当前角色不能查看照片历史。")}
    </section>
  `;
}

function renderRecordPhotoUploadBox(patient) {
  const defaultBodySite = patient.medicalRecord?.vitiligoAssessment?.bodySites || "";
  return `
    <div class="record-photo-upload">
      <div class="form-grid">
        <div class="field">
          <label>照片部位</label>
          <input class="input" data-record-photo-body-site="1" value="${escapeAttr(defaultBodySite)}" placeholder="如：面部/手背/颈部" />
        </div>
        <div class="field">
          <label>照片类型</label>
          <select class="select" data-record-photo-mode="1">
            <option value="普通光">普通光</option>
            <option value="伍德灯">伍德灯</option>
          </select>
        </div>
      </div>
      <div class="form-grid one">
        <div class="field">
          <label>照片说明</label>
          <textarea class="textarea" data-record-photo-note="1" placeholder="记录拍摄角度、皮损变化或医生标注说明"></textarea>
        </div>
      </div>
      <div class="button-row">
        <label class="btn primary file-label">上传照片
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple data-record-photo-upload="1" />
        </label>
        <span class="hint">演示版保存在本机浏览器；正式院内部署应接入受控影像存储。</span>
      </div>
    </div>
  `;
}

function renderRecordPhotoHistory(photos) {
  if (!photos.length) return `<p class="empty">暂无照片历史。上传后会在这里和照片时间轴中同时显示。</p>`;
  return `
    <div class="record-photo-history">
      ${photos.map((photo) => renderRecordPhotoHistoryItem(photo)).join("")}
    </div>
  `;
}

function renderRecordPhotoHistoryItem(photo) {
  const meta = [
    photo.date,
    photo.bodySite,
    photo.mode,
    photo.doctorConfirmed
  ].filter(Boolean).join(" · ");
  const uploadMeta = [
    photo.uploadedAt ? `上传：${photo.uploadedAt}` : "",
    photo.uploadedBy ? userDisplayName(photo.uploadedBy) : "",
    photo.fileName || ""
  ].filter(Boolean).join(" · ");
  return `
    <article class="record-photo-card">
      ${photo.imageDataUrl ? `<img src="${escapeAttr(photo.imageDataUrl)}" alt="${escapeAttr(photo.bodySite || photo.fileName || "病历照片")}" />` : `<div class="photo-placeholder">仅有记录</div>`}
      <div>
        <strong>${escapeHtml(meta || "照片记录")}</strong>
        <p>${escapeHtml(photo.note || "暂无说明")}</p>
        ${uploadMeta ? `<span>${escapeHtml(uploadMeta)}</span>` : ""}
      </div>
    </article>
  `;
}

function renderRecordQuality(quality) {
  return `
    <div class="quality-box ${quality.status === "合格" ? "pass" : ""}">
      <div>
        <strong>病历质控</strong>
        <p>${quality.missing.length ? `缺少：${escapeHtml(quality.missing.join("、"))}` : "关键字段已完整。"}</p>
      </div>
      <div>
        <strong>提示</strong>
        <p>${quality.warnings.length ? escapeHtml(quality.warnings.join("；")) : "暂无额外提示。"}</p>
      </div>
    </div>
  `;
}

function renderVitiligoTemplate(record, disabled) {
  const vitiligo = record.vitiligoAssessment || {};
  return `
    <section class="template-section">
      <div class="entry-head">
        <h3>白癜风专病模板</h3>
        <span class="badge">结构化字段</span>
      </div>
      <div class="form-grid">
        ${field(VITILIGO_TEMPLATE_LABELS.onsetDate, "medicalRecord.vitiligoAssessment.onsetDate", vitiligo.onsetDate, "text", disabled)}
        ${selectField(VITILIGO_TEMPLATE_LABELS.diseaseType, "medicalRecord.vitiligoAssessment.diseaseType", vitiligo.diseaseType, ["待分型", "寻常型", "节段型", "局限型", "散发型", "泛发型", "肢端型"], disabled)}
        ${selectField(VITILIGO_TEMPLATE_LABELS.stage, "medicalRecord.vitiligoAssessment.stage", vitiligo.stage, ["待评估", "进展期", "稳定期", "复色期"], disabled)}
        ${field(VITILIGO_TEMPLATE_LABELS.bodySites, "medicalRecord.vitiligoAssessment.bodySites", vitiligo.bodySites, "text", disabled)}
        ${field(VITILIGO_TEMPLATE_LABELS.color, "medicalRecord.vitiligoAssessment.color", vitiligo.color, "text", disabled)}
        ${field(VITILIGO_TEMPLATE_LABELS.boundary, "medicalRecord.vitiligoAssessment.boundary", vitiligo.boundary, "text", disabled)}
        ${field(VITILIGO_TEMPLATE_LABELS.surface, "medicalRecord.vitiligoAssessment.surface", vitiligo.surface, "text", disabled)}
        ${field(VITILIGO_TEMPLATE_LABELS.areaPercent, "medicalRecord.vitiligoAssessment.areaPercent", vitiligo.areaPercent, "text", disabled)}
        ${selectField(VITILIGO_TEMPLATE_LABELS.hairWhitening, "medicalRecord.vitiligoAssessment.hairWhitening", vitiligo.hairWhitening, ["未记录", "无", "有", "不确定"], disabled)}
        ${selectField(VITILIGO_TEMPLATE_LABELS.koebner, "medicalRecord.vitiligoAssessment.koebner", vitiligo.koebner, ["未记录", "阴性", "阳性", "不确定"], disabled)}
        ${field(VITILIGO_TEMPLATE_LABELS.familyHistory, "medicalRecord.vitiligoAssessment.familyHistory", vitiligo.familyHistory, "text", disabled)}
        ${field(VITILIGO_TEMPLATE_LABELS.triggerFactors, "medicalRecord.vitiligoAssessment.triggerFactors", vitiligo.triggerFactors, "text", disabled)}
      </div>
      <div class="form-grid one">
        ${areaField(VITILIGO_TEMPLATE_LABELS.woodLamp, "medicalRecord.vitiligoAssessment.woodLamp", vitiligo.woodLamp, disabled)}
        ${areaField(VITILIGO_TEMPLATE_LABELS.previousTreatment, "medicalRecord.vitiligoAssessment.previousTreatment", vitiligo.previousTreatment, disabled)}
        ${areaField(VITILIGO_TEMPLATE_LABELS.lifestyleSleep, "medicalRecord.vitiligoAssessment.lifestyleSleep", vitiligo.lifestyleSleep, disabled)}
        ${areaField(VITILIGO_TEMPLATE_LABELS.comorbidity, "medicalRecord.vitiligoAssessment.comorbidity", vitiligo.comorbidity, disabled)}
      </div>
    </section>
  `;
}

function renderRecordVersions(record) {
  const versions = record.versions || [];
  return `
    <section class="version-section">
      <h3>病历版本</h3>
      ${versions.length ? versions.map((version) => `
        <article class="version-card">
          <strong>V${escapeHtml(version.version)} · ${escapeHtml(version.action)} · ${escapeHtml(version.status)}</strong>
          <span>${escapeHtml(version.time)} · ${escapeHtml(version.actorId ? userDisplayName(version.actorId) : "系统")}</span>
          <p>${escapeHtml(version.note || "已保存版本快照。")}</p>
        </article>
      `).join("") : `<p class="empty">暂无版本快照。提交、签名、归档或修订时会自动记录。</p>`}
    </section>
  `;
}

function renderEntryList(patient, arrayName, type, title, renderer, user) {
  const items = patient[arrayName] || [];
  const canEdit = canEditPatientArray(user, arrayName, patient);
  return `
    <div class="entry-head">
      <h3>${title}</h3>
      ${canEdit ? `<button class="btn primary" data-action="add-entry" data-array="${arrayName}" data-type="${type}" data-title="${title}">新增</button>` : ""}
    </div>
    ${items.length ? `<div class="crud-summary-list">${items.map((item, index) => renderEntrySummary(item, index, arrayName, title, canEdit)).join("")}</div>` : `<p class="empty">暂无${title}。</p>`}
  `;
}

function renderEntrySummary(item, index, arrayName, title, canEdit) {
  const date = item.date || item.uploadedAt || "未填日期";
  const headline = entrySummaryHeadline(item, arrayName);
  const detail = entrySummaryDetail(item, arrayName);
  return `
    <article class="crud-summary-card">
      <div>
        <strong>${escapeHtml(headline || `${title} #${index + 1}`)}</strong>
        <span>${escapeHtml(date)} · ${escapeHtml(detail || "详情待完善")}</span>
      </div>
      <div class="button-row">
        <button class="btn action-btn ${canEdit ? "primary" : ""}" data-action="open-entry-modal" data-array="${escapeAttr(arrayName)}" data-index="${index}" data-title="${escapeAttr(title)}">${canEdit ? "编辑" : "查看"}</button>
      </div>
    </article>
  `;
}

function entrySummaryHeadline(item, arrayName) {
  if (arrayName === "examReports") return item.type || "检查报告";
  if (arrayName === "imageTimeline") return [item.bodySite, item.mode].filter(Boolean).join(" · ") || "照片记录";
  if (arrayName === "treatmentPlans") return item.phototherapy || item.medication || "治疗记录";
  if (arrayName === "phototherapySessions") return [item.device, item.bodySite].filter(Boolean).join(" · ") || "光疗剂量";
  if (arrayName === "followUps") return item.conditionChange || item.specialConcern || "回访记录";
  return "记录";
}

function entrySummaryDetail(item, arrayName) {
  if (arrayName === "examReports") return item.result || item.area || "";
  if (arrayName === "imageTimeline") return [item.aiAreaPercent ? `面积${item.aiAreaPercent}%` : "", item.doctorConfirmed, item.note].filter(Boolean).join(" · ");
  if (arrayName === "treatmentPlans") return [item.dose, item.reaction, item.nextVisit ? `复诊${item.nextVisit}` : ""].filter(Boolean).join(" · ");
  if (arrayName === "phototherapySessions") return [item.doseMj ? `${item.doseMj}mJ/cm2` : "", item.erythema, item.operatorUserId ? userName(item.operatorUserId) : ""].filter(Boolean).join(" · ");
  if (arrayName === "followUps") return [item.emotion, item.nextAction].filter(Boolean).join(" · ");
  return "";
}

function renderExamEntry(item, index, arrayName, disabled) {
  return `
    <div class="entry-card">
      ${entryHead("检查", index, arrayName, disabled)}
      <div class="form-grid">
        ${entryField("日期", arrayName, index, "date", item.date, "date", disabled)}
        ${entryField("检查类型", arrayName, index, "type", item.type, "text", disabled)}
        ${entryField("部位/面积", arrayName, index, "area", item.area, "text", disabled)}
        ${entryField("照片说明", arrayName, index, "photoNote", item.photoNote, "text", disabled)}
      </div>
      ${entryArea("结果描述", arrayName, index, "result", item.result, disabled)}
    </div>
  `;
}

function renderImageEntry(item, index, arrayName, disabled) {
  return `
    <div class="entry-card">
      ${entryHead("照片", index, arrayName, disabled)}
      ${item.imageDataUrl ? `<figure class="photo-entry-preview"><img src="${escapeAttr(item.imageDataUrl)}" alt="${escapeAttr(item.bodySite || item.fileName || "病历照片")}" /></figure>` : ""}
      <div class="form-grid">
        ${entryField("日期", arrayName, index, "date", item.date, "date", disabled)}
        ${entryField("部位", arrayName, index, "bodySite", item.bodySite, "text", disabled)}
        ${entrySelect("照片类型", arrayName, index, "mode", item.mode, ["普通光", "伍德灯"], disabled)}
        ${entryField("AI面积占比(%)", arrayName, index, "aiAreaPercent", item.aiAreaPercent, "number", disabled)}
        ${entrySelect("医生确认", arrayName, index, "doctorConfirmed", item.doctorConfirmed, ["待确认", "已确认", "退回重标"], disabled)}
      </div>
      ${entryArea("照片/标注说明", arrayName, index, "note", item.note, disabled)}
      ${(item.fileName || item.uploadedAt || item.uploadedBy) ? `<p class="hint">上传信息：${escapeHtml([item.uploadedAt, item.uploadedBy ? userDisplayName(item.uploadedBy) : "", item.fileName].filter(Boolean).join(" · "))}</p>` : ""}
      <p class="hint">演示版照片保存在本机浏览器；院内正式版应接入受控影像存储。</p>
    </div>
  `;
}

function renderTreatmentEntry(item, index, arrayName, disabled) {
  return `
    <div class="entry-card">
      ${entryHead("治疗", index, arrayName, disabled)}
      <div class="form-grid">
        ${entryField("日期", arrayName, index, "date", item.date, "date", disabled)}
        ${entryField("用药", arrayName, index, "medication", item.medication, "text", disabled)}
        ${entryField("光疗", arrayName, index, "phototherapy", item.phototherapy, "text", disabled)}
        ${entryField("剂量", arrayName, index, "dose", item.dose, "text", disabled)}
        ${entryField("局部反应", arrayName, index, "reaction", item.reaction, "text", disabled)}
        ${entryField("疗程", arrayName, index, "course", item.course, "text", disabled)}
        ${entryField("下次复诊", arrayName, index, "nextVisit", item.nextVisit, "date", disabled)}
      </div>
      ${entryArea("备注", arrayName, index, "notes", item.notes, disabled)}
    </div>
  `;
}

function renderFollowEntry(item, index, arrayName, disabled) {
  return `
    <div class="entry-card">
      ${entryHead("回访", index, arrayName, disabled)}
      <div class="form-grid">
        ${entryField("日期", arrayName, index, "date", item.date, "date", disabled)}
        ${entryField("生活情况", arrayName, index, "life", item.life, "text", disabled)}
        ${entryField("饮食/睡眠", arrayName, index, "dietSleep", item.dietSleep, "text", disabled)}
        ${entryField("情绪情况", arrayName, index, "emotion", item.emotion, "text", disabled)}
      </div>
      ${entryArea("病情变化", arrayName, index, "conditionChange", item.conditionChange, disabled)}
      ${entryArea("特殊关注", arrayName, index, "specialConcern", item.specialConcern, disabled)}
      ${entryArea("下一步动作", arrayName, index, "nextAction", item.nextAction, disabled)}
    </div>
  `;
}

function renderOrders(patient, user) {
  const items = state.serviceOrders.filter((order) => order.patientId === patient.id);
  const editable = can(user, "order:create") && canAccessPatient(user, patient, "basic");
  return `
    <div class="entry-head">
      <h3>项目/疗程销售记录</h3>
      ${editable ? `<button class="btn primary" data-action="add-order">新增开单</button>` : ""}
    </div>
    <p class="hint">用于项目执行、退款和经营统计，不设计医生个人药品销售提成。</p>
    ${items.length ? `<div class="crud-summary-list">${items.map((order) => renderOrderSummary(order, editable)).join("")}</div>` : `<p class="empty">暂无项目/疗程开单。</p>`}
  `;
}

function renderOrderSummary(order, editable) {
  return `
    <article class="crud-summary-card">
      <div>
        <strong>${escapeHtml(order.itemName || order.id)}</strong>
        <span>${escapeHtml(order.category || "未分类")} · ${money(order.amount)} · 执行 ${escapeHtml(order.executedCount || 0)}/${escapeHtml(order.totalCount || 0)} · ${escapeHtml(order.status)}</span>
      </div>
      <span class="status-pill">${escapeHtml(order.status)}</span>
      <button class="btn action-btn ${editable ? "primary" : ""}" data-action="open-order-modal" data-id="${escapeAttr(order.id)}">${editable ? "编辑" : "查看"}</button>
    </article>
  `;
}

function renderOrderEditor(order, editable, canRefund) {
  return `
    <div class="entry-card modal-editor-card">
      <div class="entry-head">
        <strong>${escapeHtml(order.id)}</strong>
        <span class="status-pill">${escapeHtml(order.status)}</span>
      </div>
      <div class="form-grid">
        ${stateField("项目名称", "serviceOrders", order.id, "itemName", order.itemName, "text", !editable)}
        ${stateField("类别", "serviceOrders", order.id, "category", order.category, "text", !editable)}
        ${stateField("金额", "serviceOrders", order.id, "amount", order.amount, "number", !editable)}
        ${stateSelect("状态", "serviceOrders", order.id, "status", order.status, ["已开单", "已成交", "执行中", "已完成", "已退款", "作废"], !editable)}
        ${stateField("已执行", "serviceOrders", order.id, "executedCount", order.executedCount, "number", !editable)}
        ${stateField("总次数", "serviceOrders", order.id, "totalCount", order.totalCount, "number", !editable)}
        ${stateSelect("归属科室", "serviceOrders", order.id, "departmentId", order.departmentId, state.departments.map((department) => [department.id, department.name]), !editable)}
        ${stateSelect("开单医生", "serviceOrders", order.id, "doctorUserId", order.doctorUserId, doctorOptions(), !editable)}
      </div>
      ${stateArea("备注", "serviceOrders", order.id, "note", order.note, !editable)}
      <div class="button-row">
        ${editable ? `<button class="btn primary" data-action="order-paid" data-id="${escapeAttr(order.id)}">登记成交</button>` : ""}
        ${canRefund ? `<button class="btn danger" data-action="order-refund" data-id="${escapeAttr(order.id)}">登记退款</button>` : ""}
      </div>
    </div>
  `;
}

function renderPrescriptions(patient, user) {
  const items = state.prescriptionRecords.filter((record) => record.patientId === patient.id);
  const canCreate = can(user, "prescription:create") && canAccessPatient(user, patient, "record");
  const canReview = can(user, "prescription:review");
  return `
    <div class="entry-head">
      <h3>处方记录与审核</h3>
      ${canCreate ? `<button class="btn primary" data-action="add-prescription">新增处方草稿</button>` : ""}
    </div>
    <p class="hint">处方必须由医生手工记录，智能系统不自动开方；院长/审核人员用于处方点评和质控追踪。</p>
    ${items.length ? `<div class="crud-summary-list">${items.map((record) => renderPrescriptionSummary(record, canCreate, canReview)).join("")}</div>` : `<p class="empty">暂无处方记录。</p>`}
  `;
}

function renderPrescriptionSummary(record, canCreate, canReview) {
  const editable = canCreate && ["草稿", "退回"].includes(record.status);
  return `
    <article class="crud-summary-card">
      <div>
        <strong>${escapeHtml(record.drugName || record.id)}</strong>
        <span>${escapeHtml(record.date || "未填日期")} · ${escapeHtml(record.course || "疗程未填")} · ${money(record.estimatedAmount || 0)}</span>
      </div>
      <span class="status-pill">${escapeHtml(record.status)}</span>
      <button class="btn action-btn ${editable || canReview ? "primary" : ""}" data-action="open-prescription-modal" data-id="${escapeAttr(record.id)}">${editable || canReview ? "编辑" : "查看"}</button>
    </article>
  `;
}

function renderPrescriptionEditor(record, canCreate, canReview) {
  const editable = canCreate && ["草稿", "退回"].includes(record.status);
  return `
    <div class="entry-card modal-editor-card">
      <div class="entry-head">
        <strong>${escapeHtml(record.id)}</strong>
        <span class="status-pill">${escapeHtml(record.status)}</span>
      </div>
      <div class="form-grid">
        ${stateField("日期", "prescriptionRecords", record.id, "date", record.date, "date", !editable)}
        ${stateField("药品/处方名称", "prescriptionRecords", record.id, "drugName", record.drugName, "text", !editable)}
        ${stateField("用法", "prescriptionRecords", record.id, "usage", record.usage, "text", !editable)}
        ${stateField("疗程", "prescriptionRecords", record.id, "course", record.course, "text", !editable)}
        ${stateField("估算金额", "prescriptionRecords", record.id, "estimatedAmount", record.estimatedAmount, "number", !editable)}
        ${stateSelect("归属科室", "prescriptionRecords", record.id, "departmentId", record.departmentId, state.departments.map((department) => [department.id, department.name]), !editable)}
      </div>
      ${stateArea("审核/退回说明", "prescriptionRecords", record.id, "reviewNote", record.reviewNote, !(canReview || editable))}
      <div class="button-row">
        ${editable ? `<button class="btn primary" data-action="prescription-status" data-id="${escapeAttr(record.id)}" data-status="待审核">提交审核</button>` : ""}
        ${canReview ? `<button class="btn primary" data-action="prescription-status" data-id="${escapeAttr(record.id)}" data-status="已审核">审核通过</button>` : ""}
        ${canReview ? `<button class="btn" data-action="prescription-status" data-id="${escapeAttr(record.id)}" data-status="退回">退回修改</button>` : ""}
        ${canReview ? `<button class="btn danger" data-action="prescription-status" data-id="${escapeAttr(record.id)}" data-status="作废">作废</button>` : ""}
      </div>
    </div>
  `;
}

function renderAiPanel(patient, analysis, user) {
  const record = patient.medicalRecord || {};
  const canConfirm = can(user, "record:write") && canAccessPatient(user, patient, "record");
  return `
    <h3>AI 辅助分析</h3>
    <p class="hint">AI 只做风险分层、摘要和沟通草稿；白斑量化、诊疗和处方结果都必须由医生确认。</p>
    <div class="ai-confirm-box">
      <div>
        <strong>AI确认状态</strong>
        <p>${record.aiSummaryConfirmedBy ? `已由 ${escapeHtml(userDisplayName(record.aiSummaryConfirmedBy))} 于 ${escapeHtml(record.aiSummaryConfirmedAt)} 确认` : "尚未医生确认，不进入正式病历结论。"}</p>
      </div>
      ${canConfirm ? `<button class="btn primary" data-action="record-action" data-record-action="ai-confirm">确认AI摘要</button>` : ""}
    </div>
    <div class="form-grid">
      <div>
        <h4>患者摘要</h4>
        <div class="summary-box">${escapeHtml(analysis.summary)}</div>
      </div>
      <div>
        <h4>建议话术</h4>
        <div class="script-box">${escapeHtml(analysis.talkScript)}</div>
        <div class="button-row"><button class="btn primary" data-action="copy-script">复制话术</button></div>
      </div>
    </div>
    <h4>影响因素</h4>
    <ul class="ai-list">
      ${analysis.factors.map((factor) => `
        <li class="factor">
          <strong>${escapeHtml(factor.label)} <span class="${factor.score > 0 ? "risk-mid" : "risk-low"}">${factor.score > 0 ? "+" : ""}${factor.score}</span></strong>
          <div class="factor-bar"><span style="width:${Math.min(100, Math.abs(factor.score) * 4)}%"></span></div>
          <span class="hint">${escapeHtml(factor.note)}</span>
        </li>
      `).join("")}
    </ul>
    <h4>下一步动作</h4>
    <ul class="ai-list">${analysis.actionItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  `;
}

function renderDirectorDashboard(user) {
  const summary = summarizeDirector(state, state.dashboardFilters);
  return `
    <section class="director-command-panel">
      <div>
        <span class="section-eyebrow">经营与医疗质控</span>
        <h3>院长看板总览</h3>
        <p class="hint">统计项目成交、退款、处方审核和治疗执行；所有数据仅用于经营管理和医疗质控。</p>
      </div>
      <div class="toolbar-row dashboard-filters">
        <select class="select" data-dashboard-filter="departmentId">
          <option value="">全部科室</option>
          ${state.departments.map((department) => `<option value="${escapeAttr(department.id)}" ${state.dashboardFilters.departmentId === department.id ? "selected" : ""}>${escapeHtml(department.name)}</option>`).join("")}
        </select>
        <select class="select" data-dashboard-filter="doctorUserId">
          <option value="">全部医生</option>
          ${doctorOptions().map(([id, label]) => `<option value="${escapeAttr(id)}" ${state.dashboardFilters.doctorUserId === id ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
        </select>
      </div>
    </section>
    <section class="stats-grid director-stats kpi-board">
      <div class="stat kpi-primary"><strong>${money(summary.totals.gross)}</strong><span>项目成交</span></div>
      <div class="stat"><strong>${money(summary.totals.refundAmount)}</strong><span>退款</span></div>
      <div class="stat"><strong>${money(summary.totals.net)}</strong><span>净额</span></div>
      <div class="stat"><strong>${summary.totals.prescriptionCount}</strong><span>处方记录</span></div>
      <div class="stat"><strong>${summary.totals.pendingPrescriptionCount}</strong><span>处方待办</span></div>
      <div class="stat"><strong>${summary.totals.executedTreatmentCount}</strong><span>治疗执行</span></div>
    </section>
    <section class="dashboard-grid settings-dashboard-grid">
      ${renderMetricTable("按科室", summary.departmentRows)}
      ${renderMetricTable("按医生", summary.doctorRows)}
    </section>
    <section class="panel">
      <div class="panel-inner">
        <h3>异常提醒</h3>
        <ul class="ai-list">
          ${summary.anomalies.length ? summary.anomalies.map((item) => `<li><strong>${escapeHtml(item.level)} · ${escapeHtml(item.title)}</strong><br><span class="hint">${escapeHtml(item.detail)}</span></li>`).join("") : `<li>暂无异常提醒。</li>`}
        </ul>
      </div>
    </section>
  `;
}

function renderMetricTable(title, rows) {
  return `
    <div class="panel">
      <div class="panel-inner">
        <h3>${title}</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>名称</th><th>成交</th><th>退款</th><th>净额</th><th>项目</th><th>处方待办</th></tr></thead>
            <tbody>
              ${rows.map((row) => `
                <tr>
                  <td>${escapeHtml(row.label)}</td>
                  <td>${money(row.gross)}</td>
                  <td>${money(row.refundAmount)}</td>
                  <td>${money(row.net)}</td>
                  <td>${row.orderCount}</td>
                  <td>${row.pendingPrescriptionCount}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderSettings(user) {
  const editable = can(user, "settings:manage");
  const section = getSettingsSection();
  return `
    <section class="settings-command-panel">
      <div>
        <span class="section-eyebrow">管理员后台</span>
        <h3>${escapeHtml(settingsSectionTitle(section))}</h3>
        <p class="hint">${escapeHtml(settingsSectionHint(section))}</p>
      </div>
      <div class="settings-section-switch">
        ${renderSettingsQuickButton("users", "账号", section)}
        ${renderSettingsQuickButton("roles", "角色", section)}
        ${renderSettingsQuickButton("departments", "科室", section)}
        ${renderSettingsQuickButton("rules", "规则", section)}
      </div>
      <div class="settings-command-action">
        ${renderSettingsHeaderAction(section, editable)}
      </div>
    </section>
    ${renderSettingsSection(section, editable)}
  `;
}

function renderSettingsQuickButton(sectionId, title, current) {
  return `
    <button class="settings-quick-tab ${current === sectionId ? "active" : ""}" data-action="settings-subnav" data-section="${escapeAttr(sectionId)}">
      ${escapeHtml(title)}
    </button>
  `;
}

function getSettingsSection() {
  return ["users", "roles", "departments", "rules"].includes(state.settingsSection) ? state.settingsSection : "users";
}

function renderSettingsMenuButton(sectionId, title, description, activeSection) {
  const active = activeSection === sectionId;
  return `
    <button class="settings-menu-item ${active ? "active" : ""}" data-action="settings-section" data-section="${escapeAttr(sectionId)}">
      <span class="settings-menu-mark">${escapeHtml(title.slice(0, 1))}</span>
      <span class="drawer-text"><strong>${escapeHtml(title)}</strong><small>${escapeHtml(description)}</small></span>
    </button>
  `;
}

function renderSettingsModuleButton(module) {
  return `
    <button class="settings-menu-item compact" data-action="nav" data-module="${escapeAttr(module.id)}">
      <span class="settings-menu-mark">${escapeHtml(moduleIcon(module))}</span>
      <span class="drawer-text"><strong>${escapeHtml(module.label)}</strong></span>
    </button>
  `;
}

function settingsSectionTitle(section) {
  if (section === "roles") return "角色管理";
  if (section === "departments") return "科室字典";
  if (section === "rules") return "权限说明";
  return "账号管理";
}

function settingsSectionHint(section) {
  if (section === "roles") return "自定义角色名称、默认可见界面和操作权限，账号分配角色时会从这里读取。";
  if (section === "departments") return "维护初诊科、复诊科、光疗室、检查室、咨询室和回访组等科室。";
  if (section === "rules") return "查看导医、医生、治疗师、回访、院长和管理员的权限边界。";
  return "按账号属性搜索，分配角色、所属科室和可见界面。";
}

function renderSettingsHeaderAction(section, editable) {
  if (!editable) return `<span class="badge">只读</span>`;
  if (section === "roles") return `<button class="btn primary" data-action="add-role">新增角色</button>`;
  if (section === "departments") return `<button class="btn primary" data-action="add-department">新增科室</button>`;
  if (section === "users") return `<button class="btn primary" data-action="toggle-new-user-form">新建账号</button>`;
  return `<span class="badge">规则只读</span>`;
}

function renderSettingsSection(section, editable) {
  if (section === "roles") return renderRoleManagementPanel(editable);
  if (section === "departments") return renderDepartmentDictionaryPanel(editable);
  if (section === "rules") return renderPermissionRules();
  return renderAccountManagementPanel(editable);
}

function renderRoleManagementPanel(editable) {
  const roleRows = getFilteredRoles();
  const selectedRole = getSelectedRole(roleRows);
  return `
    <section class="settings-content-panel role-management-panel">
      <div class="account-title-row">
        <div>
          <h3>角色列表与权限配置</h3>
          <p class="hint">按角色名称、界面、操作权限或使用人数搜索；选择一个角色后再编辑详情。</p>
        </div>
      </div>
      <div class="account-toolbar">
        <input class="input" data-role-search="query" value="${escapeAttr(state.roleSearch || "")}" placeholder="搜索角色、界面、权限、使用状态" />
        <span class="hint">显示 ${roleRows.length} / ${state.roles.length} 个角色</span>
      </div>
      ${renderRoleList(roleRows, selectedRole, editable)}
      ${roleRows.length ? "" : `<div class="empty account-empty">没有找到匹配角色，可调整搜索条件。</div>`}
    </section>
  `;
}

function getFilteredRoles() {
  const query = String(state.roleSearch || "").trim().toLowerCase();
  if (!query) return state.roles;
  return state.roles.filter((role) => roleSearchText(role).toLowerCase().includes(query));
}

function getSelectedRole(roleRows) {
  return roleRows.find((role) => role.id === state.selectedRoleId) || roleRows[0] || null;
}

function renderRoleList(roleRows, selectedRole, editable) {
  return `
    <div class="table-wrap account-table-wrap role-table-wrap">
      <table class="data-table account-table role-table">
        <thead>
          <tr>
            <th>角色名称</th>
            <th>使用账号</th>
            <th>默认界面</th>
            <th>操作权限</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${roleRows.length ? roleRows.map((role) => renderRoleRow(role, selectedRole?.id, editable)).join("") : `<tr><td colspan="5" class="empty-table-cell">没有找到角色。</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function renderRoleRow(role, selectedRoleId, editable) {
  const userCount = roleUserCount(role.id);
  const moduleText = compactList((role.moduleAccess || []).map(moduleLabel), "未配置");
  const permissionText = (role.permissions || []).includes("*") ? "全部权限" : compactList((role.permissions || []).map(permissionLabel), "未配置", 4);
  const selected = role.id === selectedRoleId;
  return `
    <tr class="${selected ? "selected" : ""}">
      <td><strong>${escapeHtml(role.name)}</strong></td>
      <td><span class="status-pill ${userCount ? "" : "muted"}">${userCount ? `${userCount}个账号` : "未分配"}</span></td>
      <td title="${escapeAttr((role.moduleAccess || []).map(moduleLabel).join("、"))}">${escapeHtml(moduleText)}</td>
      <td title="${escapeAttr((role.permissions || []).map(permissionLabel).join("、"))}">${escapeHtml(permissionText)}</td>
      <td><button class="btn action-btn ${selected ? "primary" : ""}" data-action="edit-role" data-id="${escapeAttr(role.id)}">${editable ? "编辑" : "查看"}</button></td>
    </tr>
  `;
}

function renderRoleEditor(role, editable) {
  const userCount = roleUserCount(role.id);
  return `
    <article class="role-card role-editor-card">
      <div class="role-card-head">
        <div class="field role-name-field">
          <label>角色名称</label>
          <input class="input" data-role-field="name" data-id="${escapeAttr(role.id)}" value="${escapeAttr(role.name)}" ${editable ? "" : "disabled"} />
        </div>
        <div class="role-card-actions">
          <span class="status-pill ${userCount ? "" : "muted"}">${userCount ? `${userCount}个账号使用` : "未分配账号"}</span>
          ${editable ? `<button class="btn danger" data-action="delete-role" data-id="${escapeAttr(role.id)}" ${userCount ? "disabled" : ""}>删除角色</button>` : ""}
        </div>
      </div>
      <div class="permission-picker">
        <strong>默认可见界面</strong>
        <div class="checkbox-grid">
          ${modules.map((module) => `
            <label class="check-item">
              <input type="checkbox" data-role-module="${escapeAttr(module.id)}" data-id="${escapeAttr(role.id)}" ${(role.moduleAccess || []).includes(module.id) ? "checked" : ""} ${editable ? "" : "disabled"} />
              <span>${escapeHtml(module.label)}</span>
            </label>
          `).join("")}
        </div>
      </div>
      <div class="permission-picker">
        <strong>操作权限</strong>
        <div class="checkbox-grid role-permission-grid">
          ${permissionOptions.map(([permission, label]) => `
            <label class="check-item">
              <input type="checkbox" data-role-permission="${escapeAttr(permission)}" data-id="${escapeAttr(role.id)}" ${(role.permissions || []).includes(permission) ? "checked" : ""} ${editable ? "" : "disabled"} />
              <span>${escapeHtml(label)}</span>
            </label>
          `).join("")}
        </div>
      </div>
    </article>
  `;
}

function renderDepartmentDictionaryPanel(editable) {
  return `
    <section class="settings-content-panel department-dictionary-panel">
      <div class="settings-list">
        ${state.departments.map((department) => {
          const usage = getDepartmentUsage(department.id);
          const canDelete = editable && state.departments.length > 1 && usage.businessCount === 0;
          return `
          <div class="settings-row department-row">
            <div>
              <strong>${escapeHtml(department.name)}</strong>
              <p class="hint">科室类型：${escapeHtml(department.type)}</p>
            </div>
            <span class="status-pill ${department.enabled ? "saved" : "muted"}">${department.enabled ? "启用" : "停用"}</span>
            <span class="hint department-usage">${escapeHtml(departmentUsageText(usage))}</span>
            <button class="btn action-btn ${editable ? "primary" : ""}" data-action="edit-department" data-id="${escapeAttr(department.id)}">${editable ? "编辑" : "查看"}</button>
            ${editable ? `<button class="btn action-btn" data-action="toggle-department" data-id="${escapeAttr(department.id)}">${department.enabled ? "停用" : "启用"}</button>` : ""}
            ${editable ? `<button class="btn action-btn danger" data-action="delete-department" data-id="${escapeAttr(department.id)}" ${canDelete ? "" : "disabled"} title="${escapeAttr(canDelete ? "删除该科室" : `不能删除：${departmentUsageText(usage)}`)}">删除</button>` : ""}
          </div>
        `;
        }).join("")}
      </div>
    </section>
  `;
}

function renderDepartmentEditor(department, editable) {
  const usage = getDepartmentUsage(department.id);
  const canDelete = editable && state.departments.length > 1 && usage.businessCount === 0;
  return `
    <article class="user-permission-card department-editor-card">
      <div class="form-grid">
        <div class="field">
          <label>科室名称</label>
          <input class="input" data-department-field="name" data-id="${escapeAttr(department.id)}" value="${escapeAttr(department.name)}" ${editable ? "" : "disabled"} />
        </div>
        <div class="field">
          <label>科室类型</label>
          <input class="input" data-department-field="type" data-id="${escapeAttr(department.id)}" value="${escapeAttr(department.type)}" ${editable ? "" : "disabled"} />
        </div>
      </div>
      <div class="quality-box">
        <div>
          <strong>当前状态</strong>
          <p>${department.enabled ? "启用" : "停用"}</p>
        </div>
        <div>
          <strong>引用情况</strong>
          <p>${escapeHtml(departmentUsageText(usage))}</p>
        </div>
      </div>
      ${editable ? `
        <div class="button-row">
          <button class="btn" data-action="toggle-department" data-id="${escapeAttr(department.id)}">${department.enabled ? "停用科室" : "启用科室"}</button>
          <button class="btn danger" data-action="delete-department" data-id="${escapeAttr(department.id)}" ${canDelete ? "" : "disabled"} title="${escapeAttr(canDelete ? "删除该科室" : `不能删除：${departmentUsageText(usage)}`)}">删除科室</button>
        </div>
      ` : ""}
    </article>
  `;
}

function renderAccountManagementPanel(editable) {
  const accountRows = getFilteredPermissionUsers();
  const selectedUser = getSelectedPermissionUser(accountRows);
  return `
    <section class="settings-content-panel account-management">
      <div class="account-title-row">
        <div>
          <h3>账号列表与权限分配</h3>
          <p class="hint">按登录账号、姓名、角色、科室、可见界面、状态或未保存修改搜索。</p>
        </div>
      </div>
      <div class="account-toolbar">
        <input class="input" data-account-search="query" value="${escapeAttr(state.accountSearch || "")}" placeholder="搜索账号、姓名、角色、科室、界面、启用状态" />
        <span class="hint">显示 ${accountRows.length} / ${state.users.length} 个账号</span>
      </div>
      ${renderUserAccountList(accountRows, selectedUser, editable)}
      ${accountRows.length ? "" : `<div class="empty account-empty">没有找到匹配账号，可调整搜索条件。</div>`}
    </section>
  `;
}

function getFilteredPermissionUsers() {
  const query = String(state.accountSearch || "").trim().toLowerCase();
  if (!query) return state.users;
  return state.users.filter((user) => accountSearchText(user).toLowerCase().includes(query));
}

function getSelectedPermissionUser(accountRows) {
  return accountRows.find((user) => user.id === state.selectedPermissionUserId) || accountRows[0] || null;
}

function renderUserAccountList(accountRows, selectedUser, editable) {
  return `
    <div class="table-wrap account-table-wrap">
      <table class="data-table account-table">
        <thead>
          <tr>
            <th>登录账号</th>
            <th>账号名称</th>
            <th>角色</th>
            <th>状态</th>
            <th>所属科室</th>
            <th>可见界面</th>
            <th>修改状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          ${accountRows.length ? accountRows.map((item) => renderUserAccountRow(item, selectedUser?.id, editable)).join("") : `<tr><td colspan="8" class="empty-table-cell">没有找到账号。</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function renderUserAccountRow(user, selectedUserId, editable) {
  const draft = state.userPermissionDrafts[user.id] || cloneUserForDraft(user);
  const dirty = isUserDraftDirty(user.id);
  const selected = user.id === selectedUserId;
  const departmentText = compactList((draft.departmentIds || []).map(departmentName));
  const moduleText = compactList((draft.moduleAccess || []).map(moduleLabel));
  return `
    <tr class="${selected ? "selected" : ""} ${dirty ? "dirty" : ""}">
      <td><strong>${escapeHtml(draft.loginName || "未设置")}</strong></td>
      <td>${escapeHtml(draft.name || "未命名")}</td>
      <td>${escapeHtml(roleName(draft.role))}</td>
      <td><span class="status-pill ${draft.enabled ? "" : "muted"}">${draft.enabled ? "启用" : "停用"}</span></td>
      <td title="${escapeAttr((draft.departmentIds || []).map(departmentName).join("、"))}">${escapeHtml(departmentText)}</td>
      <td title="${escapeAttr((draft.moduleAccess || []).map(moduleLabel).join("、"))}">${escapeHtml(moduleText)}</td>
      <td>${dirty ? `<span class="status-pill warning">未保存</span>` : `<span class="status-pill saved">已保存</span>`}</td>
      <td><button class="btn action-btn ${selected ? "primary" : ""}" data-action="edit-user-permission" data-id="${escapeAttr(user.id)}">${editable ? "编辑" : "查看"}</button></td>
    </tr>
  `;
}

function renderUserPermissionCard(user, editable) {
  const draft = getUserDraft(user.id);
  const dirty = isUserDraftDirty(user.id);
  return `
    <article class="user-permission-card ${dirty ? "dirty" : ""}">
      <div class="user-permission-head">
        <div>
          <strong>${escapeHtml(draft.name)}</strong>
          <span>登录账号：${escapeHtml(draft.loginName || "未设置")} · ${draft.enabled ? "启用" : "停用"}${dirty ? " · 有未保存修改" : ""}</span>
        </div>
        ${editable ? `
          <div class="button-row">
            <button class="btn primary" data-action="save-user-permission" data-id="${escapeAttr(user.id)}">保存权限</button>
            <button class="btn" data-action="cancel-user-draft" data-id="${escapeAttr(user.id)}">取消修改</button>
          </div>
        ` : `<span class="status-pill">${draft.enabled ? "启用" : "停用"}</span>`}
      </div>
      <div class="form-grid">
        <div class="field">
          <label>登录账号</label>
          <input class="input" data-user-field="loginName" data-id="${escapeAttr(user.id)}" value="${escapeAttr(draft.loginName || "")}" ${editable ? "" : "disabled"} />
        </div>
        <div class="field">
          <label>账号名称</label>
          <input class="input" data-user-field="name" data-id="${escapeAttr(user.id)}" value="${escapeAttr(draft.name)}" ${editable ? "" : "disabled"} />
        </div>
        <div class="field">
          <label>角色</label>
          <select class="select" data-user-field="role" data-id="${escapeAttr(user.id)}" ${editable ? "" : "disabled"}>
            ${roleOptions(draft.role)}
          </select>
        </div>
        <div class="field">
          <label>账号状态</label>
          <select class="select" data-user-field="enabled" data-id="${escapeAttr(user.id)}" ${editable ? "" : "disabled"}>
            <option value="true" ${draft.enabled ? "selected" : ""}>启用</option>
            <option value="false" ${!draft.enabled ? "selected" : ""}>停用</option>
          </select>
        </div>
      </div>
      <div class="permission-picker">
        <strong>所属科室</strong>
        <div class="checkbox-grid">
          ${state.departments.map((department) => `
            <label class="check-item">
              <input type="checkbox" data-user-department="${escapeAttr(department.id)}" data-id="${escapeAttr(user.id)}" ${(draft.departmentIds || []).includes(department.id) ? "checked" : ""} ${editable ? "" : "disabled"} />
              <span>${escapeHtml(department.name)}</span>
            </label>
          `).join("")}
        </div>
      </div>
      <div class="permission-picker">
        <strong>可见界面</strong>
        <div class="checkbox-grid">
          ${modules.map((module) => `
            <label class="check-item">
              <input type="checkbox" data-user-module="${escapeAttr(module.id)}" data-id="${escapeAttr(user.id)}" ${(draft.moduleAccess || []).includes(module.id) ? "checked" : ""} ${editable ? "" : "disabled"} />
              <span>${escapeHtml(module.label)}</span>
            </label>
          `).join("")}
        </div>
      </div>
    </article>
  `;
}

function renderNewUserCard() {
  const draft = state.newUserDraft;
  return `
    <article class="user-permission-card new-account-card">
      <div class="user-permission-head">
        <div>
          <strong>新建账号</strong>
          <span>填写账号信息后点击“保存新账号”才会生效。</span>
        </div>
        <div class="button-row">
          <button class="btn primary" data-action="save-new-user">保存新账号</button>
          <button class="btn" data-action="reset-new-user">清空重填</button>
        </div>
      </div>
      <div class="form-grid">
        <div class="field">
          <label>登录账号</label>
          <input class="input" data-new-user-field="loginName" value="${escapeAttr(draft.loginName || "")}" />
        </div>
        <div class="field">
          <label>账号名称</label>
          <input class="input" data-new-user-field="name" value="${escapeAttr(draft.name || "")}" />
        </div>
        <div class="field">
          <label>角色</label>
          <select class="select" data-new-user-field="role">
            ${roleOptions(draft.role)}
          </select>
        </div>
        <div class="field">
          <label>账号状态</label>
          <select class="select" data-new-user-field="enabled">
            <option value="true" ${draft.enabled ? "selected" : ""}>启用</option>
            <option value="false" ${!draft.enabled ? "selected" : ""}>停用</option>
          </select>
        </div>
      </div>
      <div class="permission-picker">
        <strong>所属科室</strong>
        <div class="checkbox-grid">
          ${state.departments.map((department) => `
            <label class="check-item">
              <input type="checkbox" data-new-user-department="${escapeAttr(department.id)}" ${(draft.departmentIds || []).includes(department.id) ? "checked" : ""} />
              <span>${escapeHtml(department.name)}</span>
            </label>
          `).join("")}
        </div>
      </div>
      <div class="permission-picker">
        <strong>可见界面</strong>
        <div class="checkbox-grid">
          ${modules.map((module) => `
            <label class="check-item">
              <input type="checkbox" data-new-user-module="${escapeAttr(module.id)}" ${(draft.moduleAccess || []).includes(module.id) ? "checked" : ""} />
              <span>${escapeHtml(module.label)}</span>
            </label>
          `).join("")}
        </div>
      </div>
    </article>
  `;
}

function accountSearchText(user) {
  const draft = state.userPermissionDrafts[user.id] || cloneUserForDraft(user);
  const departments = (draft.departmentIds || []).map(departmentName);
  const visibleModules = (draft.moduleAccess || []).map(moduleLabel);
  return [
    draft.loginName,
    draft.name,
    roleName(draft.role),
    draft.role,
    draft.enabled ? "启用" : "停用",
    isUserDraftDirty(user.id) ? "未保存" : "已保存",
    ...departments,
    ...visibleModules
  ].join(" ");
}

function roleSearchText(role) {
  const modulesText = (role.moduleAccess || []).map(moduleLabel);
  const permissionText = (role.permissions || []).map(permissionLabel);
  const userCount = roleUserCount(role.id);
  return [
    role.id,
    role.name,
    userCount ? `${userCount}个账号` : "未分配",
    ...modulesText,
    ...permissionText
  ].join(" ");
}

function roleUserCount(roleId) {
  return state.users.filter((user) => user.role === roleId).length;
}

function compactList(items, emptyText = "未分配", limit = 3) {
  const values = items.filter(Boolean);
  if (!values.length) return emptyText;
  if (values.length <= limit) return values.join("、");
  return `${values.slice(0, limit).join("、")} 等${values.length}项`;
}

function renderPermissionRules() {
  return `
    <section class="panel">
      <div class="panel-inner">
        <h3>权限说明</h3>
        <div class="rule-grid">
          ${state.roles.map((role) => `
            <div>
              <strong>${escapeHtml(role.name)}</strong>
              <p>可见界面：${escapeHtml((role.moduleAccess || []).map(moduleLabel).join("、") || "未配置")}。</p>
              <p>操作权限：${escapeHtml((role.permissions || []).includes("*") ? "全部权限" : compactList((role.permissions || []).map(permissionLabel), "未配置", 6))}。</p>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderAuditLog() {
  return `
    <section class="page-head">
      <div>
        <h2>审计日志</h2>
        <p class="hint">记录挂号、接诊、开单、处方、退款、导出和敏感查看等关键行为。</p>
      </div>
      <button class="btn primary" data-action="copy-audit">复制审计日志</button>
    </section>
    <section class="panel">
      <div class="panel-inner">
        <div class="audit-list">
          ${state.auditLogs.slice(0, 120).map((log) => `
            <article class="audit-item">
              <strong>${escapeHtml(auditActionLabel(log.action))} · ${escapeHtml(auditTargetLabel(log))}</strong>
              <span>${escapeHtml(log.time)} · ${escapeHtml(userDisplayName(log.actorId))}</span>
              <p>${escapeHtml(log.detail || "")}</p>
            </article>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderPatientFlowCard(patient) {
  const registration = latestRegistration(patient.id);
  const orderCount = state.serviceOrders.filter((item) => item.patientId === patient.id).length;
  const rxCount = state.prescriptionRecords.filter((item) => item.patientId === patient.id).length;
  return `
    <div class="panel">
      <div class="panel-inner">
        <span class="mini-title">患者主线</span>
        <ol class="flow-list">
          <li>导医挂号：${escapeHtml(registration?.status || "未挂号")}</li>
          <li>医生接诊：${escapeHtml(patient.doctor || "未分配")}</li>
          <li>项目/疗程：${orderCount} 条</li>
          <li>处方记录：${rxCount} 条</li>
          <li>回访复诊：${patient.followUps?.length || 0} 条</li>
        </ol>
      </div>
    </div>
  `;
}

function renderFollowUpReminder(analysis) {
  return `
    <div class="panel">
      <div class="panel-inner">
        <span class="mini-title">复诊/回访提醒</span>
        <p>建议下次跟进：<strong>${analysis.nextFollowUp}</strong></p>
        <ul class="ai-list">${analysis.actionItems.slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    </div>
  `;
}

function renderComplianceNote() {
  return `
    <div class="privacy">
      <strong>合规提示</strong>
      <p>处方、病历和照片均需权限控制和操作留痕；经营统计用于管理与质控，不设计个人药品销售提成。</p>
    </div>
  `;
}

function renderEmptyWorkspace() {
  return `
    <div class="panel">
      <div class="panel-inner">
        <h2>暂无患者</h2>
        <p class="empty">点击左侧“新建患者”或导入表格开始。</p>
      </div>
    </div>
  `;
}

function renderDenied(message) {
  return `<div class="permission-box"><strong>权限受限</strong><p>${escapeHtml(message)}</p></div>`;
}

function field(label, path, value, type = "text", disabled = false) {
  return `<div class="field"><label>${label}</label><input class="input" type="${type}" data-field="${path}" value="${escapeAttr(value ?? "")}" ${disabled ? "disabled" : ""} /></div>`;
}

function selectField(label, path, value, options, disabled = false) {
  return `<div class="field"><label>${label}</label><select class="select" data-field="${path}" ${disabled ? "disabled" : ""}>${normalizeOptions(options).map(([optionValue, optionLabel]) => `<option value="${escapeAttr(optionValue)}" ${value === optionValue ? "selected" : ""}>${escapeHtml(optionLabel)}</option>`).join("")}</select></div>`;
}

function areaField(label, path, value, disabled = false) {
  return `<div class="field"><label>${label}</label><textarea class="textarea" data-field="${path}" ${disabled ? "disabled" : ""}>${escapeHtml(value ?? "")}</textarea></div>`;
}

function draftField(label, fieldName, type = "text") {
  return `<div class="field"><label>${label}</label><input class="input" type="${type}" data-draft="${fieldName}" value="${escapeAttr(state.registrationDraft[fieldName] ?? "")}" /></div>`;
}

function draftSelect(label, fieldName, options) {
  const normalized = normalizeOptions(options);
  return `<div class="field"><label>${label}</label><select class="select" data-draft="${fieldName}">${normalized.map(([value, text]) => `<option value="${escapeAttr(value)}" ${state.registrationDraft[fieldName] === value ? "selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select></div>`;
}

function entryHead(label, index, arrayName, disabled = false) {
  return `<div class="entry-head"><strong>${label} #${index + 1}</strong>${disabled ? "" : `<button class="btn danger" data-action="delete-entry" data-array="${arrayName}" data-index="${index}">删除</button>`}</div>`;
}

function entryField(label, arrayName, index, fieldName, value, type = "text", disabled = false) {
  return `<div class="field"><label>${label}</label><input class="input" type="${type}" data-array="${arrayName}" data-index="${index}" data-field="${fieldName}" value="${escapeAttr(value ?? "")}" ${disabled ? "disabled" : ""} /></div>`;
}

function entrySelect(label, arrayName, index, fieldName, value, options, disabled = false) {
  return `<div class="field"><label>${label}</label><select class="select" data-array="${arrayName}" data-index="${index}" data-field="${fieldName}" ${disabled ? "disabled" : ""}>${normalizeOptions(options).map(([optionValue, optionLabel]) => `<option value="${escapeAttr(optionValue)}" ${value === optionValue ? "selected" : ""}>${escapeHtml(optionLabel)}</option>`).join("")}</select></div>`;
}

function entryArea(label, arrayName, index, fieldName, value, disabled = false) {
  return `<div class="field"><label>${label}</label><textarea class="textarea" data-array="${arrayName}" data-index="${index}" data-field="${fieldName}" ${disabled ? "disabled" : ""}>${escapeHtml(value ?? "")}</textarea></div>`;
}

function stateField(label, arrayName, id, fieldName, value, type = "text", disabled = false) {
  return `<div class="field"><label>${label}</label><input class="input" type="${type}" data-state-array="${arrayName}" data-id="${escapeAttr(id)}" data-field="${fieldName}" value="${escapeAttr(value ?? "")}" ${disabled ? "disabled" : ""} /></div>`;
}

function stateSelect(label, arrayName, id, fieldName, value, options, disabled = false) {
  return `<div class="field"><label>${label}</label><select class="select" data-state-array="${arrayName}" data-id="${escapeAttr(id)}" data-field="${fieldName}" ${disabled ? "disabled" : ""}>${normalizeOptions(options).map(([optionValue, optionLabel]) => `<option value="${escapeAttr(optionValue)}" ${value === optionValue ? "selected" : ""}>${escapeHtml(optionLabel)}</option>`).join("")}</select></div>`;
}

function stateArea(label, arrayName, id, fieldName, value, disabled = false) {
  return `<div class="field"><label>${label}</label><textarea class="textarea" data-state-array="${arrayName}" data-id="${escapeAttr(id)}" data-field="${fieldName}" ${disabled ? "disabled" : ""}>${escapeHtml(value ?? "")}</textarea></div>`;
}

function departmentInput(department, fieldName, editable) {
  return `<input class="input" data-department-field="${fieldName}" data-id="${escapeAttr(department.id)}" value="${escapeAttr(department[fieldName])}" ${editable ? "" : "disabled"} />`;
}

function getDepartmentUsage(departmentId) {
  const patientCount = state.patients.filter((patient) => patient.departmentId === departmentId).length;
  const registrationCount = state.registrations.filter((item) => item.departmentId === departmentId).length;
  const orderCount = state.serviceOrders.filter((item) => item.departmentId === departmentId).length;
  const prescriptionCount = state.prescriptionRecords.filter((item) => item.departmentId === departmentId).length;
  const userCount = state.users.filter((user) => (user.departmentIds || []).includes(departmentId)).length;
  const businessCount = patientCount + registrationCount + orderCount + prescriptionCount;
  return { patientCount, registrationCount, orderCount, prescriptionCount, userCount, businessCount };
}

function departmentUsageText(usage) {
  const parts = [
    usage.patientCount ? `${usage.patientCount}个患者` : "",
    usage.registrationCount ? `${usage.registrationCount}条挂号` : "",
    usage.orderCount ? `${usage.orderCount}条开单` : "",
    usage.prescriptionCount ? `${usage.prescriptionCount}条处方` : ""
  ].filter(Boolean);
  if (parts.length) return parts.join("、");
  if (usage.userCount) return `${usage.userCount}个账号引用，删除时自动移除`;
  return "未使用";
}

function removeDepartment(departmentId) {
  state.departments = state.departments.filter((department) => department.id !== departmentId);
  state.users.forEach((user) => {
    user.departmentIds = (user.departmentIds || []).filter((id) => id !== departmentId);
  });
  Object.values(state.userPermissionDrafts || {}).forEach((draft) => {
    draft.departmentIds = (draft.departmentIds || []).filter((id) => id !== departmentId);
  });
  state.newUserDraft.departmentIds = (state.newUserDraft.departmentIds || []).filter((id) => id !== departmentId);
  const fallbackDepartmentId = state.departments.find((department) => department.enabled)?.id || state.departments[0]?.id || "";
  if (state.registrationDraft.departmentId === departmentId) state.registrationDraft.departmentId = fallbackDepartmentId;
  if (state.patientCreateDraft.departmentId === departmentId) state.patientCreateDraft.departmentId = fallbackDepartmentId;
  if (state.dashboardFilters.departmentId === departmentId) state.dashboardFilters.departmentId = "";
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return normalizeState(JSON.parse(stored));
    const legacy = localStorage.getItem("clinic-ai-workbench-v1");
    if (legacy) return normalizeState(JSON.parse(legacy));
  } catch (error) {
    console.warn("Failed to load local state", error);
  }
  return normalizeState(createDefaultState());
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function saveAndRender() {
  persist();
  render();
}

function closeCrudModal() {
  if (state.crudModal?.type === "newUser") state.showNewUserForm = false;
  state.crudModal = null;
}

function renderHeaderOnly() {
  const selected = getSelectedPatient();
  const target = document.querySelector("[data-live-header]");
  if (target && selected) {
    target.innerHTML = `${renderPatientHeader(selected)}${renderRiskCard(assessPatient(selected))}`;
  }
}

function renderGuideDoctorHint() {
  const target = document.querySelector("[data-guide-doctor-hint]");
  if (target) target.textContent = guideDoctorHint();
}

function getCurrentUser() {
  return state.users.find((user) => user.id === state.sessionUserId && user.enabled) || null;
}

function getSelectedPatient() {
  return state.patients.find((patient) => patient.id === state.selectedId) || getVisiblePatients(state, getCurrentUser())[0] || state.patients[0];
}

function getFilteredPatients(user) {
  const query = state.query.trim().toLowerCase();
  return getVisiblePatients(state, user).filter((patient) => {
    if (state.tagFilter && patient.tag !== state.tagFilter) return false;
    if (!query) return true;
    const text = [
      patient.id,
      patient.nameAlias,
      patient.tag,
      patient.source,
      patient.status,
      departmentName(patient.departmentId),
      patient.doctor,
      patient.medicalRecord?.chiefComplaint,
      patient.medicalRecord?.diagnosis
    ].join(" ").toLowerCase();
    return text.includes(query);
  });
}

function getQueueItems(user) {
  return state.registrations
    .filter((item) => !state.queueFilter || item.status === state.queueFilter)
    .filter((item) => can(user, "cross_department:view") || can(user, "registration:create") || user.departmentIds?.includes(item.departmentId))
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || String(a.queueNo).localeCompare(String(b.queueNo)));
}

function findOrCreateRegistrationPatient() {
  const draft = state.registrationDraft;
  const existing = state.patients.find((patient) => {
    const sameContact = draft.contact && patient.contact && patient.contact === draft.contact;
    const sameAlias = draft.nameAlias && patient.nameAlias === draft.nameAlias && String(patient.age) === String(draft.age);
    return sameContact || sameAlias;
  });
  if (existing) return existing;
  const patient = createEmptyPatient(state.patients.length + 1, {
    nameAlias: draft.nameAlias || `患者${state.patients.length + 1}`,
    age: Number(draft.age) || 30,
    gender: draft.gender || "未填",
    source: draft.source || "导医台",
    contact: draft.contact || "",
    departmentId: draft.departmentId,
    ownerUserId: draft.doctorUserId || "u-doctor-he",
    doctor: userName(draft.doctorUserId) || "未分配"
  });
  state.patients.unshift(patient);
  return patient;
}

function createDefaultPatientDraft(user) {
  const doctorId = user?.role === "doctor" ? user.id : doctorOptions()[0]?.[0] || "u-doctor-he";
  return createPatientCreateDraft({
    departmentId: user?.departmentIds?.[0] || "dept-initial",
    ownerUserId: doctorId
  });
}

function savePatientCreateDraft(user) {
  const draft = state.patientCreateDraft || createDefaultPatientDraft(user);
  const nameAlias = String(draft.nameAlias || "").trim();
  if (!nameAlias) return { ok: false, message: "请先填写患者别名或姓名。" };
  const ownerUserId = draft.ownerUserId || (user?.role === "doctor" ? user.id : "u-doctor-he");
  const patient = createEmptyPatient(state.patients.length + 1, {
    nameAlias,
    age: Number(draft.age) || 30,
    gender: draft.gender || "未填",
    source: draft.source || "门诊建档",
    contact: draft.contact || "",
    tag: draft.tag || "初诊-待评估",
    departmentId: draft.departmentId || user?.departmentIds?.[0] || "dept-initial",
    ownerUserId,
    doctor: userName(ownerUserId) || "未分配"
  });
  state.patients.unshift(patient);
  state.selectedId = patient.id;
  state.module = "patients";
  state.activeTab = "basic";
  state.showPatientCreateForm = false;
  state.patientCreateDraft = createDefaultPatientDraft(user);
  return { ok: true, patient };
}

async function handleRecordPhotoUpload(input, user) {
  const patient = getSelectedPatient();
  if (!patient) return deny("请先选择患者。");
  if (!canEditPatientArray(user, "imageTimeline", patient)) {
    input.value = "";
    return deny("当前角色不能上传病历照片。");
  }
  const files = Array.from(input.files || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) {
    input.value = "";
    return deny("请选择图片文件。");
  }
  const bodySite = document.querySelector("[data-record-photo-body-site]")?.value?.trim() || "";
  const mode = document.querySelector("[data-record-photo-mode]")?.value || "普通光";
  const note = document.querySelector("[data-record-photo-note]")?.value?.trim() || "";
  try {
    const entries = [];
    for (const file of files) {
      const dataUrl = await readPhotoAsDataUrl(file);
      entries.push(createImageUploadEntry({
        fileName: file.name,
        dataUrl,
        bodySite,
        mode,
        note,
        uploadedBy: user.id
      }));
    }
    patient.imageTimeline ||= [];
    patient.imageTimeline.unshift(...entries);
    addAudit("imageTimeline:upload", "Patient", patient.id, `上传病历照片 ${entries.length} 张。`);
    showToast(`已上传 ${entries.length} 张病历照片。`);
    input.value = "";
    saveAndRender();
  } catch (error) {
    console.error(error);
    input.value = "";
    deny("照片读取失败，请重新选择图片。");
  }
}

function readPhotoAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const original = String(reader.result || "");
      shrinkImageDataUrl(original).then(resolve).catch(() => resolve(original));
    };
    reader.onerror = () => reject(reader.error || new Error("读取图片失败"));
    reader.readAsDataURL(file);
  });
}

function shrinkImageDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const maxSide = 1280;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
      if (scale >= 1) {
        resolve(dataUrl);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function canEditPatientArray(user, arrayName, patient) {
  if (!canAccessPatient(user, patient, arrayName === "examReports" ? "record" : "basic")) return false;
  if (arrayName === "examReports") return can(user, "exam:write") || can(user, "record:write");
  if (arrayName === "imageTimeline") return can(user, "image:write") || can(user, "record:write");
  if (arrayName === "treatmentPlans") return can(user, "treatment:write");
  if (arrayName === "phototherapySessions") return can(user, "phototherapy:write") || can(user, "treatment:write");
  if (arrayName === "followUps") return can(user, "followup:write") || can(user, "record:write");
  return false;
}

function canEditSpecialty(user, patient) {
  return canAccessPatient(user, patient, "record") && (can(user, "specialty:write") || can(user, "record:write"));
}

function getVisibleTabs(user, patient) {
  return patientTabs.filter((tab) => can(user, tab.read) || (tab.alt && can(user, tab.alt)) || tab.id === "basic")
    .filter((tab) => tab.id !== "record" || canAccessPatient(user, patient, "record"))
    .filter((tab) => tab.id !== "specialty" || canAccessPatient(user, patient, "basic"))
    .filter((tab) => tab.id !== "ai" || canAccessPatient(user, patient, "record"));
}

function ensureAllowedModule() {
  const user = getCurrentUser();
  if (!moduleVisible(modules.find((item) => item.id === state.module), user)) {
    state.module = defaultModuleForUser(user);
  }
}

function ensureVisiblePatient() {
  const user = getCurrentUser();
  if (!state.patients.some((patient) => patient.id === state.selectedId && canAccessPatient(user, patient, "basic"))) {
    state.selectedId = getVisiblePatients(state, user)[0]?.id || state.patients[0]?.id;
  }
}

function moduleVisible(module, user) {
  if (!module) return false;
  if (!user?.moduleAccess?.includes(module.id)) return false;
  if (module.roles) return module.roles.includes(user.role);
  if (module.id === "settings") return canAccessSettings(user);
  return can(user, module.permission);
}

function canAccessSettings(user) {
  return can(user, "settings:view") || can(user, "settings:manage");
}

function defaultModuleForUser(user) {
  return modules.find((module) => moduleVisible(module, user))?.id || "patients";
}

function addAudit(action, targetType, targetId, detail) {
  const actorId = getCurrentUser()?.id || state.loginSelectedUserId || "anonymous";
  state.auditLogs.unshift(createAuditLog(actorId, action, targetType, targetId, detail));
  state.auditLogs = state.auditLogs.slice(0, 300);
}

function recordActionLabel(action) {
  const labels = {
    submit: "病历已提交。",
    sign: "医生已签名确认。",
    archive: "病历已归档锁定。",
    revise: "已发起病历修订。",
    "ai-confirm": "AI摘要已由医生确认。"
  };
  return labels[action] || "病历状态已更新。";
}

function printMedicalRecord(patient) {
  const text = formatMedicalRecordText(patient, state);
  const printWindow = window.open("", "_blank", "width=880,height=1000");
  if (!printWindow) {
    showToast("浏览器阻止了打印窗口，请允许弹窗后重试。");
    return;
  }
  printWindow.document.write(`
    <!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(patient.nameAlias)} 电子病历</title>
        <style>
          body { font-family: "Microsoft YaHei", Arial, sans-serif; color: #202837; padding: 32px; line-height: 1.7; }
          pre { white-space: pre-wrap; font: inherit; }
          .stamp { margin-top: 24px; color: #687486; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <pre>${escapeHtml(text)}</pre>
        <div class="stamp">由白癜风门诊专病工作台生成，打印前请核对患者身份和医生签名。</div>
        <script>window.addEventListener("load", () => window.print());</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

function deny(message) {
  showToast(message);
  render();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("已复制到剪贴板。");
  } catch {
    showToast("当前浏览器不允许自动复制，可手动选中文本复制。");
  }
  saveAndRender();
}

function showToast(message) {
  toast = message;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast = "";
    render();
  }, 2500);
}

function updateStateArrayItem(target) {
  const item = state[target.dataset.stateArray]?.find((candidate) => candidate.id === target.dataset.id);
  if (!item) return;
  item[target.dataset.field] = target.value;
  if (target.dataset.stateArray === "registrations") {
    const patient = findPatient(item.patientId);
    if (patient) {
      patient.departmentId = item.departmentId;
      patient.ownerUserId = item.doctorUserId || patient.ownerUserId;
      patient.doctor = userName(patient.ownerUserId) || patient.doctor;
    }
  }
}

function getUserDraft(userId) {
  if (!state.userPermissionDrafts[userId]) {
    const targetUser = state.users.find((item) => item.id === userId);
    state.userPermissionDrafts[userId] = cloneUserForDraft(targetUser);
  }
  return state.userPermissionDrafts[userId];
}

function cloneUserForDraft(user) {
  return {
    loginName: user?.loginName || "",
    name: user?.name || "",
    role: user?.role || "guide",
    departmentIds: [...(user?.departmentIds || [])],
    moduleAccess: [...(user?.moduleAccess || defaultModuleAccessForRole(user?.role || "guide"))],
    enabled: user?.enabled !== false
  };
}

function isUserDraftDirty(userId) {
  const targetUser = state.users.find((item) => item.id === userId);
  const draft = state.userPermissionDrafts[userId];
  if (!targetUser || !draft) return false;
  return JSON.stringify(cloneUserForDraft(targetUser)) !== JSON.stringify(draft);
}

function updateUserDraftField(userId, fieldName, value) {
  const draft = getUserDraft(userId);
  draft[fieldName] = fieldName === "enabled" ? value === "true" : value;
  if (fieldName === "role") {
    draft.moduleAccess = defaultModuleAccessForRole(value);
  }
}

function updateUserDraftCollection(userId, fieldName, value, checked) {
  const draft = getUserDraft(userId);
  updateCollection(draft, fieldName, value, checked);
}

function updateNewUserDraftField(fieldName, value) {
  state.newUserDraft[fieldName] = fieldName === "enabled" ? value === "true" : value;
  if (fieldName === "role") {
    state.newUserDraft.moduleAccess = defaultModuleAccessForRole(value);
  }
}

function updateNewUserDraftCollection(fieldName, value, checked) {
  updateCollection(state.newUserDraft, fieldName, value, checked);
}

function updateRoleCollection(roleId, fieldName, value, checked) {
  const role = state.roles.find((item) => item.id === roleId);
  if (!role) return;
  updateCollection(role, fieldName, value, checked);
}

function updateCollection(target, fieldName, value, checked) {
  const collection = new Set(target[fieldName] || []);
  if (checked) {
    collection.add(value);
  } else {
    collection.delete(value);
  }
  target[fieldName] = [...collection];
}

function saveUserDraft(userId, currentAdminId) {
  const targetUser = state.users.find((item) => item.id === userId);
  const draft = getUserDraft(userId);
  const validation = validateUserDraft(draft, userId);
  if (!targetUser) return { ok: false, message: "账号不存在。" };
  if (!validation.ok) return validation;
  if (targetUser.id === currentAdminId && draft.enabled === false) return { ok: false, message: "不能停用当前登录的管理员账号。" };
  if (targetUser.id === currentAdminId && !draft.moduleAccess.includes("settings")) return { ok: false, message: "不能移除当前管理员账号的权限管理界面。" };
  Object.assign(targetUser, {
    loginName: draft.loginName.trim(),
    name: draft.name.trim(),
    role: draft.role,
    departmentIds: [...draft.departmentIds],
    moduleAccess: [...draft.moduleAccess],
    permissions: [...rolePermissions(draft.role)],
    roleName: roleName(draft.role),
    enabled: draft.enabled !== false
  });
  delete state.userPermissionDrafts[userId];
  if (!targetUser.enabled && state.sessionUserId === targetUser.id) {
    state.sessionUserId = "";
    state.currentUserId = "";
  }
  return { ok: true, user: targetUser };
}

function saveNewUserDraft() {
  const draft = state.newUserDraft;
  const validation = validateUserDraft(draft);
  if (!validation.ok) return validation;
  const user = {
    id: `u-custom-${Date.now().toString(36)}`,
    loginName: draft.loginName.trim(),
    name: draft.name.trim(),
    role: draft.role,
    departmentIds: [...draft.departmentIds],
    moduleAccess: [...draft.moduleAccess],
    permissions: [...rolePermissions(draft.role)],
    roleName: roleName(draft.role),
    enabled: draft.enabled !== false
  };
  state.users.push(user);
  state.newUserDraft = createEmptyUserDraft(nextNewUserDraftNumber());
  return { ok: true, user };
}

function nextNewUserDraftNumber() {
  const usedNumbers = state.users
    .map((user) => String(user.loginName || "").match(/^账号(\d+)$/)?.[1])
    .filter(Boolean)
    .map((number) => Number(number));
  const maxNumber = usedNumbers.length ? Math.max(...usedNumbers) : 0;
  return maxNumber + 1;
}

function validateUserDraft(draft, currentUserId = "") {
  if (!String(draft.loginName || "").trim()) return { ok: false, message: "请填写登录账号。" };
  if (!String(draft.name || "").trim()) return { ok: false, message: "请填写账号名称。" };
  if (!state.roles.some((role) => role.id === draft.role)) return { ok: false, message: "请选择有效角色。" };
  if (!draft.departmentIds?.length) return { ok: false, message: "请至少分配一个所属科室。" };
  if (!draft.moduleAccess?.length) return { ok: false, message: "请至少分配一个可见界面。" };
  const duplicatedLogin = state.users.some((item) => item.id !== currentUserId && item.loginName === draft.loginName.trim());
  if (duplicatedLogin) return { ok: false, message: "登录账号已存在，请换一个。" };
  return { ok: true };
}

function defaultModuleAccessForRole(role) {
  return [...(state.roles.find((item) => item.id === role)?.moduleAccess || ["patients"])];
}

function rolePermissions(roleId) {
  return [...(state.roles.find((role) => role.id === roleId)?.permissions || [])];
}

function refreshUserRoleFields() {
  state.users.forEach((user) => {
    user.permissions = rolePermissions(user.role);
    user.roleName = roleName(user.role);
  });
}

function createRoleDraft() {
  const number = nextRoleNumber();
  return {
    id: `role-custom-${Date.now().toString(36)}`,
    name: `新角色${number}`,
    permissions: ["patient:list", "patient:basic"],
    moduleAccess: ["patients"],
    builtIn: false
  };
}

function nextRoleNumber() {
  const usedNumbers = state.roles
    .map((role) => String(role.name || "").match(/^新角色(\d+)$/)?.[1])
    .filter(Boolean)
    .map((number) => Number(number));
  const maxNumber = usedNumbers.length ? Math.max(...usedNumbers) : 0;
  return maxNumber + 1;
}

function setPath(object, path, value) {
  const parts = path.split(".");
  let target = object;
  parts.slice(0, -1).forEach((part) => {
    target[part] ||= {};
    target = target[part];
  });
  target[parts.at(-1)] = value;
  if (path === "ownerUserId") object.doctor = userName(value) || object.doctor;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === "\"" && quoted && next === "\"") {
      cell += "\"";
      i += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  const [headers, ...records] = rows;
  if (!headers) return [];
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [header.trim(), (record[index] || "").trim()])));
}

function latestRegistration(patientId) {
  return state.registrations
    .filter((item) => item.patientId === patientId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
}

function findPatient(patientId) {
  return state.patients.find((patient) => patient.id === patientId);
}

function patientNameById(patientId) {
  return findPatient(patientId)?.nameAlias || patientId || "相关患者";
}

function departmentName(departmentId) {
  return state.departments.find((department) => department.id === departmentId)?.name || departmentId || "未分配";
}

function userName(userId) {
  return state.users.find((user) => user.id === userId)?.name;
}

function doctorOptions() {
  return state.users.filter((user) => user.role === "doctor" && user.enabled).map((user) => [user.id, user.name]);
}

function moduleLabel(moduleId) {
  return modules.find((module) => module.id === moduleId)?.label || moduleId;
}

function bodyRegionLabel(regionId) {
  return BODY_REGION_DEFINITIONS.find((region) => region.id === regionId)?.label || regionId || "部位";
}

function roleName(roleId) {
  return state.roles?.find((role) => role.id === roleId)?.name || ROLE_LABELS[roleId] || roleId;
}

function roleOptions(selectedRoleId) {
  return (state.roles || []).map((role) => `<option value="${escapeAttr(role.id)}" ${selectedRoleId === role.id ? "selected" : ""}>${escapeHtml(role.name)}</option>`).join("");
}

function permissionLabel(permission) {
  return permissionOptions.find(([value]) => value === permission)?.[1] || permission;
}

function moduleIcon(module) {
  const icons = {
    guide: "导",
    patients: "患",
    director: "院",
    settings: "权",
    audit: "审"
  };
  return icons[module.id] || module.label.slice(0, 1);
}

function shortTag(tag) {
  const text = String(tag || "");
  return text.length > 8 ? `${text.slice(0, 8)}…` : text;
}

function userDisplayName(userId) {
  const user = state.users.find((item) => item.id === userId);
  if (!user) return "未知账号";
  return `${user.name}（${user.loginName || roleName(user.role)}）`;
}

function auditActionLabel(action) {
  const labels = {
    "auth:login": "登录系统",
    "auth:logout": "退出系统",
    "patient:create": "新建患者",
    "patient:import": "导入患者",
    "registration:create": "挂号分诊",
    "registration:update": "更新候诊队列",
    "image:view": "查看照片时间轴",
    "examReports:create": "新增检查报告",
    "examReports:delete": "删除检查报告",
    "imageTimeline:create": "新增照片记录",
    "imageTimeline:upload": "上传病历照片",
    "imageTimeline:delete": "删除照片记录",
    "specialty:view": "查看专科评估",
    "specialty:vasiSnapshot": "保存VASI评估",
    "treatmentPlans:create": "新增治疗记录",
    "treatmentPlans:delete": "删除治疗记录",
    "phototherapySessions:create": "新增光疗剂量",
    "phototherapySessions:delete": "删除光疗剂量",
    "followUps:create": "新增回访记录",
    "followUps:delete": "删除回访记录",
    "serviceOrder:create": "新增项目疗程",
    "payment:create": "登记成交收款",
    "refund:create": "登记退款",
    "prescription:create": "新增处方草稿",
    "prescription:review": "更新处方审核",
    "medicalRecord:submit": "提交电子病历",
    "medicalRecord:sign": "医生签名",
    "medicalRecord:archive": "归档电子病历",
    "medicalRecord:revise": "发起病历修订",
    "medicalRecord:ai-confirm": "确认智能摘要",
    "medicalRecord:exportText": "复制病历文本",
    "medicalRecord:exportJson": "复制病历数据",
    "medicalRecord:print": "打印电子病历",
    "department:create": "新增科室",
    "department:update": "更新科室",
    "department:delete": "删除科室",
    "role:create": "新增角色",
    "role:delete": "删除角色",
    "user:create": "新建账号",
    "user:update": "更新账号",
    "user:department": "分配科室权限",
    "user:moduleAccess": "分配界面权限",
    "export:data": "复制系统备份",
    "audit:export": "复制审计日志",
    "dashboard:filter": "筛选院长看板"
  };
  return labels[action] || "系统操作";
}

function auditTargetLabel(log) {
  if (log.targetType === "User") return `账号：${userDisplayName(log.targetId)}`;
  if (log.targetType === "Patient" || log.targetType === "MedicalRecord") {
    const patient = findPatient(log.targetId);
    return `${log.targetType === "MedicalRecord" ? "电子病历" : "患者"}：${patient?.nameAlias || "相关患者"}`;
  }
  if (log.targetType === "Registration") {
    const registration = state.registrations.find((item) => item.id === log.targetId);
    const patient = registration ? findPatient(registration.patientId) : null;
    return `挂号记录：${registration?.queueNo || "相关记录"}${patient ? `（${patient.nameAlias}）` : ""}`;
  }
  if (log.targetType === "ServiceOrder") {
    const order = state.serviceOrders.find((item) => item.id === log.targetId);
    return `项目疗程：${order?.itemName || "相关记录"}`;
  }
  if (log.targetType === "PrescriptionRecord") {
    const record = state.prescriptionRecords.find((item) => item.id === log.targetId);
    const patient = record ? findPatient(record.patientId) : null;
    return `处方记录：${patient?.nameAlias || ""}${record?.drugName ? ` · ${record.drugName}` : "相关记录"}`;
  }
  if (log.targetType === "Department") {
    const department = state.departments.find((item) => item.id === log.targetId);
    return `科室：${department?.name || "相关科室"}`;
  }
  if (log.targetType === "Role") {
    const role = state.roles.find((item) => item.id === log.targetId);
    return `角色：${role?.name || "相关角色"}`;
  }
  if (log.targetType === "Dashboard") return "院长看板";
  if (log.targetType === "State") return "系统备份";
  if (log.targetType === "AuditLog") return "审计日志";
  return "相关记录";
}

function guideDoctorHint() {
  const doctor = state.users.find((user) => user.id === state.registrationDraft.doctorUserId);
  const department = departmentName(state.registrationDraft.departmentId);
  return doctor ? `${department} · ${doctor.name}` : `${department} · 暂不指定医生`;
}

function queueButton(registration, status, label, user) {
  const allowed = can(user, "registration:update") || can(user, "queue:accept");
  return allowed ? `<button class="btn ${status === "取消" ? "danger" : ""}" data-action="queue-status" data-id="${escapeAttr(registration.id)}" data-status="${status}">${label}</button>` : "";
}

function normalizeOptions(options) {
  return options.map((option) => Array.isArray(option) ? option : [option, option]);
}

function riskClassName(level) {
  if (level === "高风险") return "risk-high";
  if (level === "中风险") return "risk-mid";
  return "risk-low";
}

function money(value) {
  return `¥${Math.round(Number(value) || 0).toLocaleString("zh-CN")}`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}
