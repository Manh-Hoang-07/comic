
export enum ContextType {
    SYSTEM = 'system',
    GROUP = 'group'
}

export enum RbacPermission {
    AUTHENTICATED = 'authenticated',
    USER = 'user'
}

export const SYSTEM_CONTEXT_CODE = 'system';

/**
 * TẬP HỢP HẰNG SỐ QUYỀN TRUY CẬP (CORE PERMISSIONS)
 * Các giá trị 'code' ở đây PHẢI TRÙNG KHỚP hoàn toàn với dữ liệu trong cột 'code' của bảng 'permissions'.
 * Việc dùng cấu trúc đối tượng giúp việc gọi quyền trong Code rất dễ dàng: PERM.USER.CREATE
 */
export const PERM = {
    // ─── TẦNG HỆ THỐNG & CẤU HÌNH (SYSTEM & CONFIG) ─────────────────────
    SYSTEM: {
        MANAGE: 'system.manage',        // Quyền tối cao (Super Admin)
        CONFIG_VIEW: 'system.config.view',
        CONFIG_UPDATE: 'system.config.update',
        BANNER_MANAGE: 'system.banner.manage',
    },

    // ─── TẦNG PHÂN QUYỀN (IAM & RBAC) ───────────────────────────────────
    ROLE: {
        VIEW: 'role.view',
        CREATE: 'role.create',
        UPDATE: 'role.update',
        DELETE: 'role.delete',
        MANAGE: 'role.manage',
    },
    PERMISSION: {
        VIEW: 'permission.view',
        SYNC: 'permission.sync',        // Đồng bộ quyền từ code vào DB
    },
    ASSIGNMENT: {
        VIEW: 'assignment.view',
        MANAGE: 'assignment.manage',    // Gán role cho user (Phân quyền)
    },

    // ─── TẦNG QUẢN LÝ TÀI KHOẢN (USER & IDENTITY) ────────────────────────
    USER: {
        VIEW: 'user.view',
        CREATE: 'user.create',
        UPDATE: 'user.update',
        DELETE: 'user.delete',
        STATUS: 'user.status',          // Khóa/Mở khóa tài khoản
    },
    PROFILE: {
        VIEW: 'profile.view',
        UPDATE: 'profile.update',
    },

    // ─── TẦNG QUẢN TRỊ NỘI DUNG (CONTENT - TRUYỆN & CHƯƠNG) ──────────────
    COMIC: {
        VIEW: 'comic.view',
        CREATE: 'comic.create',
        UPDATE: 'comic.update',
        DELETE: 'comic.delete',
        APPROVE: 'comic.approve',       // Phê duyệt truyện lên sàn
    },
    CHAPTER: {
        VIEW: 'chapter.view',
        CREATE: 'chapter.create',
        UPDATE: 'chapter.update',
        DELETE: 'chapter.delete',
    },

    // ─── TIỆN ÍCH & DỊCH VỤ (UTILITIES) ──────────────────────────────────
    MENU: {
        VIEW: 'menu.view',
        MANAGE: 'menu.manage',          // Thêm/Sửa/Xóa Menu dashboard
    },
    LOCATION: {
        VIEW: 'location.view',
        MANAGE: 'location.manage',      // Quản lý Quốc gia, Tỉnh thành
    },
    NOTIFICATION: {
        VIEW: 'notification.view',
        SEND: 'notification.send',      // Gửi thông báo hệ thống
    }
};
