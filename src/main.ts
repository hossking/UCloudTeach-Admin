import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import axios from 'axios'
import {Tool} from "@/util/tool";


// 配置全局的默认url 从环境配置中读取
axios.defaults.baseURL = process.env.VUE_APP_SERVER
// 配置axios请求日志显示
axios.interceptors.request.use(function (config) {
    const token = store.state.user.token;
    if (Tool.isNotEmpty(token) && config.headers) {
        config.headers.satoken = token;
        console.log("在请求headers中添加token信息: ", token);
    }
    console.log("请求参数为：", config);
    return config;
}, error => {
    return Promise.reject(error);
})
// 配置axios响应日志显示
axios.interceptors.response.use(function (response) {
    if (response.data.content) {
        if (response.data.content.code===401) {
            store.commit("setUser", {});
            window.location.href = "/admin/login";
        }
    }
    
    
    console.log("返回结果为：", response);
    return response;
}, error => {
    console.log("返回错误：", error);
    return Promise.reject(error);
})

const app = createApp(App).use(store).use(router).use(Antd)
app.mount('#app')

// 打印环境配置
console.log("环境:" + process.env.NODE_ENV);
console.log("服务端:" + process.env.VUE_APP_SERVER);