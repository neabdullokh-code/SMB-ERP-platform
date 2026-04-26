import type { CompanyWorkspaceRole, LoginIntent, Permission, PrivilegedAccessFlags, Role } from "./platform";

export type AccessSurface = "company" | "bank";

export type PermissionGroupKey =
  | "tenant_governance"
  | "finance_operations"
  | "inventory_operations"
  | "production_operations"
  | "service_operations"
  | "executive_oversight"
  | "auditor_readonly"
  | "bank_monitoring"
  | "credit_operations"
  | "audit_compliance";

export interface PermissionDefinition {
  key: Permission;
  label: string;
  description: string;
  group: PermissionGroupKey;
  risk: "baseline" | "sensitive" | "high";
}

export interface PermissionGroupDefinition {
  key: PermissionGroupKey;
  label: string;
  summary: string;
  uxGuidance: string;
  permissions: Permission[];
}

export interface RoleAccessPolicy {
  role: Role;
  label: string;
  summary: string;
  surface: AccessSurface;
  defaultRedirectPath: string;
  loginIntent: LoginIntent;
  sessionTtlMinutes: number;
  privilegedAccess: PrivilegedAccessFlags;
  permissions: Permission[];
}

export interface CompanyWorkspaceAccessPolicy {
  role: CompanyWorkspaceRole;
  label: string;
  summary: string;
  authRole: Extract<Role, "company_admin" | "employee">;
  defaultPermissionGroups: PermissionGroupKey[];
}

export const permissionDefinitions: Record<Permission, PermissionDefinition> = {
  "tenant.read": {
    key: "tenant.read",
    label: "Просмотр тенанта",
    description: "Просмотр метаданных рабочего пространства, пользователей и операционного контекста тенанта.",
    group: "tenant_governance",
    risk: "baseline"
  },
  "tenant.manage": {
    key: "tenant.manage",
    label: "Управление тенантом",
    description: "Изменение настроек тенанта, политик рабочего пространства и административных параметров.",
    group: "tenant_governance",
    risk: "high"
  },
  "finance.read": {
    key: "finance.read",
    label: "Просмотр финансов",
    description: "Просмотр бухгалтерских книг, счетов, затрат, движения денежных средств и финансовой аналитики.",
    group: "finance_operations",
    risk: "sensitive"
  },
  "finance.manage": {
    key: "finance.manage",
    label: "Управление финансами",
    description: "Создание, согласование и изменение финансовых записей, влияющих на отчетность.",
    group: "finance_operations",
    risk: "high"
  },
  "inventory.manage": {
    key: "inventory.manage",
    label: "Управление складом",
    description: "Приемка, списание, перемещение и корректировка складских остатков.",
    group: "inventory_operations",
    risk: "sensitive"
  },
  "production.manage": {
    key: "production.manage",
    label: "Управление производством",
    description: "Ведение производственных заказов, спецификаций и этапов производственного цикла.",
    group: "production_operations",
    risk: "sensitive"
  },
  "service_order.manage": {
    key: "service_order.manage",
    label: "Управление сервисными заказами",
    description: "Создание и выполнение сервисных заказов, этапов обслуживания и связанных затрат.",
    group: "service_operations",
    risk: "sensitive"
  },
  "bank.monitor": {
    key: "bank.monitor",
    label: "Банковский мониторинг",
    description: "Мониторинг портфеля тенантов, рисков и операционных индикаторов банка.",
    group: "bank_monitoring",
    risk: "high"
  },
  "credit.apply": {
    key: "credit.apply",
    label: "Подача кредитной заявки",
    description: "Подача и ведение кредитных заявок от имени тенанта.",
    group: "credit_operations",
    risk: "sensitive"
  },
  "credit.review": {
    key: "credit.review",
    label: "Рассмотрение кредита",
    description: "Просмотр кредитных заявок, скорингов и риск-факторов на стороне банка.",
    group: "credit_operations",
    risk: "sensitive"
  },
  "credit.manage": {
    key: "credit.manage",
    label: "Управление кредитом",
    description: "Принятие решения по заявке: одобрение, отклонение, эскалация и изменение условий.",
    group: "credit_operations",
    risk: "high"
  },
  "audit.read": {
    key: "audit.read",
    label: "Просмотр аудита",
    description: "Просмотр неизменяемых событий безопасности, операций и журналов аудита.",
    group: "audit_compliance",
    risk: "sensitive"
  }
};

export const permissionGroupDefinitions: Record<PermissionGroupKey, PermissionGroupDefinition> = {
  tenant_governance: {
    key: "tenant_governance",
    label: "Администрирование предприятия",
    summary: "Управление структурой тенанта, сотрудниками, ролями и политиками доступа.",
    uxGuidance: "Критичные административные действия выполняются только в явно выделенных интерфейсах с аудит-следом.",
    permissions: ["tenant.read", "tenant.manage"]
  },
  finance_operations: {
    key: "finance_operations",
    label: "Бухгалтерия и экономика",
    summary: "Отчеты, себестоимость, движения денежных средств и финансовая аналитика.",
    uxGuidance: "Отделяйте режим чтения от режимов изменения и отображайте статус согласования рядом с финансовыми действиями.",
    permissions: ["finance.read", "finance.manage"]
  },
  inventory_operations: {
    key: "inventory_operations",
    label: "Складские операции",
    summary: "Приход/расход, межскладские перемещения и инвентаризация.",
    uxGuidance: "Для корректировок остатков используйте явные подтверждения и показывайте значения до/после.",
    permissions: ["inventory.manage"]
  },
  production_operations: {
    key: "production_operations",
    label: "Производственные операции",
    summary: "Заказы в производство, сырьевые требования, этапы выполнения и учет брака.",
    uxGuidance: "Состояния производственного процесса должны быть прозрачны, а необратимые действия подтверждаться контекстно.",
    permissions: ["production.manage"]
  },
  service_operations: {
    key: "service_operations",
    label: "Сервисные операции",
    summary: "Сервисные заявки, этапы выполнения и учет операционных затрат.",
    uxGuidance: "Показывайте ответственного и текущий статус согласования прямо в карточке заявки.",
    permissions: ["service_order.manage"]
  },
  executive_oversight: {
    key: "executive_oversight",
    label: "Руководство и KPI",
    summary: "Дашборды, KPI и документы на согласовании в режиме управленческого контроля.",
    uxGuidance: "Для руководства показывайте только агрегированные показатели и маршруты согласования.",
    permissions: ["tenant.read", "finance.read"]
  },
  auditor_readonly: {
    key: "auditor_readonly",
    label: "Аудиторский read-only",
    summary: "Наблюдение и контроль без права изменения данных.",
    uxGuidance: "Для аудитора все действия должны быть в режиме просмотра с сохранением трассировки.",
    permissions: ["tenant.read", "finance.read", "audit.read"]
  },
  bank_monitoring: {
    key: "bank_monitoring",
    label: "Мониторинг банка",
    summary: "Портфельный контроль всех тенантов, мониторинг лимитов и ключевых рисков.",
    uxGuidance: "Явно разделяйте банковские и корпоративные элементы управления, чтобы исключить путаницу контекста.",
    permissions: ["bank.monitor"]
  },
  credit_operations: {
    key: "credit_operations",
    label: "Кредитные операции",
    summary: "Жизненный цикл кредитной заявки: подача, скоринг, рассмотрение и принятие решения.",
    uxGuidance: "Разделяйте клиентский поток подачи заявки и банковский поток анализа/решения.",
    permissions: ["credit.apply", "credit.review", "credit.manage"]
  },
  audit_compliance: {
    key: "audit_compliance",
    label: "Аудит и контроль",
    summary: "Режим контроля и проверки: доступ к журналам и трассировке действий (только чтение).",
    uxGuidance: "Для всех проверяемых действий показывайте источник, время и исполнителя.",
    permissions: ["audit.read"]
  }
};

export const roleAccessPolicies: Record<Role, RoleAccessPolicy> = {
  super_admin: {
    role: "super_admin",
    label: "Супер-админ",
    summary: "Центральный технический администратор банка: глобальная конфигурация системы, все тенанты, классификаторы.",
    surface: "bank",
    defaultRedirectPath: "/bank/settings",
    loginIntent: "bank_staff",
    sessionTtlMinutes: 60,
    privilegedAccess: {
      isPrivileged: true,
      requiresDedicatedAccount: true,
      isBreakGlass: false,
      sessionTtlMinutes: 60
    },
    permissions: ["tenant.read", "tenant.manage", "bank.monitor", "audit.read"]
  },
  bank_admin: {
    role: "bank_admin",
    label: "Банк-админ",
    summary: "Бизнес/операционный администратор банка: подключение новых компаний, мониторинг, лимиты и кредитные решения.",
    surface: "bank",
    defaultRedirectPath: "/bank/home",
    loginIntent: "bank_staff",
    sessionTtlMinutes: 120,
    privilegedAccess: {
      isPrivileged: true,
      requiresDedicatedAccount: true,
      isBreakGlass: false,
      sessionTtlMinutes: 120
    },
    permissions: ["tenant.read", "bank.monitor", "audit.read", "credit.review", "credit.manage"]
  },
  company_admin: {
    role: "company_admin",
    label: "Администратор предприятия",
    summary: "Внутренний администратор компании: сотрудники, роли, локальные справочники и операционное управление.",
    surface: "company",
    defaultRedirectPath: "/smb/home",
    loginIntent: "smb_customer",
    sessionTtlMinutes: 480,
    privilegedAccess: {
      isPrivileged: false,
      requiresDedicatedAccount: false,
      isBreakGlass: false,
      sessionTtlMinutes: 480
    },
    permissions: ["tenant.read", "tenant.manage", "finance.read", "finance.manage", "inventory.manage", "production.manage", "service_order.manage", "audit.read", "credit.apply"]
  },
  employee: {
    role: "employee",
    label: "Сотрудник",
    summary: "Исполнитель с ограниченными правами для повседневных операций в рамках назначенных зон доступа.",
    surface: "company",
    defaultRedirectPath: "/smb/home",
    loginIntent: "smb_customer",
    sessionTtlMinutes: 480,
    privilegedAccess: {
      isPrivileged: false,
      requiresDedicatedAccount: false,
      isBreakGlass: false,
      sessionTtlMinutes: 480
    },
    permissions: ["tenant.read", "finance.read", "inventory.manage", "service_order.manage"]
  }
};

export const companyWorkspaceAccessPolicies: Record<CompanyWorkspaceRole, CompanyWorkspaceAccessPolicy> = {
  owner: {
    role: "owner",
    label: "Руководитель",
    summary: "Руководитель компании: дашборды, KPI и утверждение документов, требующих согласования.",
    authRole: "company_admin",
    defaultPermissionGroups: [
      "tenant_governance",
      "finance_operations",
      "inventory_operations",
      "production_operations",
      "service_operations",
      "audit_compliance"
    ]
  },
  company_admin: {
    role: "company_admin",
    label: "Администратор предприятия",
    summary: "Администратор компании: управление пользователями, ролями и локальными справочниками.",
    authRole: "company_admin",
    defaultPermissionGroups: [
      "tenant_governance",
      "finance_operations",
      "inventory_operations",
      "production_operations",
      "service_operations",
      "audit_compliance"
    ]
  },
  manager: {
    role: "manager",
    label: "Менеджер (legacy)",
    summary: "Устаревшая роль для совместимости. Рекомендуется заменить на профильные роли новой модели.",
    authRole: "employee",
    defaultPermissionGroups: [
      "finance_operations",
      "inventory_operations",
      "production_operations",
      "service_operations"
    ]
  },
  operator: {
    role: "operator",
    label: "Оператор (legacy)",
    summary: "Устаревшая роль для совместимости. Рекомендуется заменить на профильные роли новой модели.",
    authRole: "employee",
    defaultPermissionGroups: [
      "inventory_operations",
      "production_operations",
      "service_operations"
    ]
  },
  warehouse_clerk: {
    role: "warehouse_clerk",
    label: "Кладовщик",
    summary: "Кладовщик: приход/расход, межскладские перемещения и инвентаризация.",
    authRole: "employee",
    defaultPermissionGroups: ["inventory_operations"]
  },
  production_operator: {
    role: "production_operator",
    label: "Оператор производства / начальник цеха",
    summary: "Производство: заказы, сырьевые требования, этапы операций и учет брака.",
    authRole: "employee",
    defaultPermissionGroups: ["production_operations"]
  },
  service_staff: {
    role: "service_staff",
    label: "Сотрудник сервиса",
    summary: "Сервис: заявки на обслуживание, этапы выполнения и операционные затраты.",
    authRole: "employee",
    defaultPermissionGroups: ["service_operations"]
  },
  accountant_economist: {
    role: "accountant_economist",
    label: "Бухгалтер / экономист",
    summary: "Финансы: отчеты, себестоимость и анализ затрат.",
    authRole: "employee",
    defaultPermissionGroups: ["finance_operations"]
  },
  executive: {
    role: "executive",
    label: "Руководитель",
    summary: "Руководитель: дашборды, KPI и контроль согласований.",
    authRole: "employee",
    defaultPermissionGroups: ["executive_oversight", "audit_compliance"]
  },
  auditor: {
    role: "auditor",
    label: "Аудитор / контролер",
    summary: "Только чтение: контрольные проверки и аудит-следы.",
    authRole: "employee",
    defaultPermissionGroups: ["auditor_readonly"]
  }
};

export function permissionsForRole(role: Role): Permission[] {
  return [...roleAccessPolicies[role].permissions];
}

export function permissionGroupsForPermissions(permissions: readonly Permission[]): PermissionGroupDefinition[] {
  const groups = new Set<PermissionGroupKey>();

  for (const permission of permissions) {
    groups.add(permissionDefinitions[permission].group);
  }

  return [...groups].map((groupKey) => permissionGroupDefinitions[groupKey]);
}

export function permissionGroupsForRole(role: Role): PermissionGroupDefinition[] {
  return permissionGroupsForPermissions(roleAccessPolicies[role].permissions);
}

export function isCompanyWorkspaceRole(role: string): role is CompanyWorkspaceRole {
  return role === "owner"
    || role === "company_admin"
    || role === "manager"
    || role === "operator"
    || role === "warehouse_clerk"
    || role === "production_operator"
    || role === "service_staff"
    || role === "accountant_economist"
    || role === "executive"
    || role === "auditor";
}

export function companyWorkspaceAuthRole(role: CompanyWorkspaceRole): Extract<Role, "company_admin" | "employee"> {
  return companyWorkspaceAccessPolicies[role].authRole;
}

export function defaultPermissionGroupsForWorkspaceRole(role: CompanyWorkspaceRole): PermissionGroupKey[] {
  return [...companyWorkspaceAccessPolicies[role].defaultPermissionGroups];
}

export function normalizePermissionGroupKeys(permissionGroups: readonly PermissionGroupKey[]): PermissionGroupKey[] {
  return [...new Set(permissionGroups.filter((group): group is PermissionGroupKey => group in permissionGroupDefinitions))];
}

export function permissionsForPermissionGroups(permissionGroups: readonly PermissionGroupKey[]): Permission[] {
  const permissions = new Set<Permission>();

  for (const group of normalizePermissionGroupKeys(permissionGroups)) {
    for (const permission of permissionGroupDefinitions[group].permissions) {
      permissions.add(permission);
    }
  }

  return [...permissions];
}

export function resolvePermissionGroupsForWorkspaceRole(
  role: CompanyWorkspaceRole,
  permissionGroups?: readonly PermissionGroupKey[]
): PermissionGroupKey[] {
  if (!permissionGroups?.length) {
    return defaultPermissionGroupsForWorkspaceRole(role);
  }

  return normalizePermissionGroupKeys(permissionGroups);
}

export function permissionsForWorkspaceRole(
  role: CompanyWorkspaceRole,
  permissionGroups?: readonly PermissionGroupKey[]
): Permission[] {
  return permissionsForPermissionGroups(resolvePermissionGroupsForWorkspaceRole(role, permissionGroups));
}

export function hasPermission(permissions: readonly Permission[], permission: Permission) {
  return permissions.includes(permission);
}

export function hasAnyPermission(permissions: readonly Permission[], required: readonly Permission[]) {
  return required.length === 0 || required.some((permission) => permissions.includes(permission));
}

export function hasEveryPermission(permissions: readonly Permission[], required: readonly Permission[]) {
  return required.every((permission) => permissions.includes(permission));
}
