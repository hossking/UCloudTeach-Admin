import {createRouter, createWebHistory, RouteRecordRaw} from 'vue-router'
import store from "@/store";
import {Tool} from "@/util/tool";

const routes: Array<RouteRecordRaw> = [
    {
        path: '/admin/login',
        name: 'Login',
        component: () => import('@/views/Login.vue'),
        meta: {
            loginRequired: false
        }
    },
    {
        path: '/admin',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/admin/stu',
        name: 'AdminStu',
        component: () => import('@/views/admin-stu.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/admin/grade',
        name: 'AdminGrade',
        component: () => import('@/views/admin-grade.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/admin/subject',
        name: 'AdminSubject',
        component: () => import('@/views/admin-subject.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/admin/course',
        name: 'AdminCourse',
        component: () => import('@/views/admin-course.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/admin/content',
        name: 'AdminContent',
        component: () => import('@/views/admin-content.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/admin/course/member',
        name: 'AdminCourseMember',
        component: () => import('@/views/admin-course-member.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/admin/course/comment',
        name: 'AdminCourseComment',
        component: () => import('@/views/admin-course-comment.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/admin/question',
        name: 'AdminQuestion',
        component: () => import('@/views/admin-question.vue'),
        meta: {
            loginRequired: true
        }
    }, {
        path: '/admin/question/edit',
        name: 'AdminQuestionEdit',
        component: () => import('@/views/admin-question-edit.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/admin/paper',
        name: 'AdminPaper',
        component: () => import('@/views/admin-paper.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/admin/paper/question',
        name: 'AdminPaperQuestion',
        component: () => import('@/views/admin-paper-question.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/admin/exam',
        name: 'AdminExam',
        component: () => import('@/views/admin-exam.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/admin/config/swipe',
        name: 'AdminSwipe',
        component: () => import('@/views/admin-swipe.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/admin/config/grid',
        name: 'AdminGrid',
        component: () => import('@/views/admin-grid.vue'),
        meta: {
            loginRequired: true
        }
    },
    {
        path: '/admin/super',
        name: 'AdminSuper',
        component: () => import('@/views/admin-super.vue'),        meta: {
            loginRequired: true
        }
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

// 管理接口路由拦截
router.beforeEach((to, from, next) => {
    if (to.matched.some(function (item) {
        console.log(item, "是否需要登录校验: ", item.meta.loginRequired);
        return item.meta.loginRequired;
    })) {
        // 拦截
        const loginUser = store.state.user;
        if (Tool.isEmpty(loginUser)) {
            next('/admin/login');
        } else {
            next();
        }
    } else {
        next();
    }
})


export default router
