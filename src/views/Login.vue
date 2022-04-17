<template>
  <div class="outer-wrap">
    <div class="login-panel">
      <h1 style="font-size: 30px;margin-bottom: -35px;margin-top: 20px;color: #2d2e2e">优云教管理系统</h1>
      <a-form
          ref="loginRef"
          :model="loginInfo"
          :label-col="{ style: { width: '150px' } }"
          class="login-form">
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="loginInfo.username"/>
        </a-form-item>
        <a-form-item label="密码" name="password">
          <a-input v-model:value="loginInfo.password" type="password"/>
        </a-form-item>
        <a-form-item style="margin-left: 130px;margin-top: 10px">
          <a-button type="primary" @click="onSubmit">登录</a-button>
          <a-button style="margin-left: 10px" @click="onReset">重置</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
  <a-modal v-model:visible="successVisible" :footer="false" :closable="false">
    <a-result status="success" title="登录成功" style="text-align: center;">
      <a-button type="primary" @click="routeFunc">确定</a-button>
    </a-result>
  </a-modal>
</template>

<script lang="ts">
import {defineComponent, ref, computed} from "vue";
import {message} from "ant-design-vue";
import axios from "axios";
import store from "@/store";
import router from "@/router";
declare let hexMd5: any;
declare let KEY: any;
declare let TencentCaptcha:any;
declare let loadErrorCallback:any;

export default defineComponent({
  name: "Login",
  components: {
  },
  setup() {
    // 登录表单对象
    const loginRef = ref();
    // 登录信息
    const loginInfo = ref();
    loginInfo.value = {
      username: "",
      password: ""
    }

    const successVisible = ref(false);

    // 保存表单
    const onSubmit = () => {
      try {
        let reg = new RegExp('^[A-Za-z0-9]+$')
        if (!reg.test(loginInfo.value.username)) {
          message.error("用户名输入不合法");
          return;
        }
        // 使用腾讯防水墙服务提供验证码功能
        let captcha1 = new TencentCaptcha('2089345195', (res: any) => {
          if (res.ret===0) {
            // 重新创建一个对象来存储用户名密码
            let info = {username: "", password: "",ticket: "",randStr:""};
            info.ticket = res.ticket;
            info.randStr = res.randstr;
            // 用户名赋值
            info.username = loginInfo.value.username;
            // 用户密码加盐MD5
            info.password = hexMd5(loginInfo.value.password + KEY);

            axios.post("/api/admin/login", info).then((response) => {
              const data = response.data;
              if (data.success) {
                // 保存用户信息至SessionStorage中
                store.commit("setUser", data.content);
                successVisible.value = true;
              } else {
                message.error(data.message);
              }
            })
          } else {
            message.error("请校验后登陆");
          }
        });
        captcha1.show();
      } catch (e) {
        console.log(e)
        loadErrorCallback();
      }
    }

    // 重置表单
    const onReset = () => {
      loginRef.value.resetFields();
    }

    const routeFunc = () => {
      window.location.href = "/"
    }

    return {
      loginRef,
      loginInfo,
      onReset,
      onSubmit,
      successVisible,
      routeFunc
    }
  }

})
</script>
<style scoped>
.outer-wrap {
  height: 100%;
  position: relative;
  background: url("../assets/bg2.jpg");
  width: 100%;
  background-size: 100% 100%;
}

.login-panel {
  width: 400px;
  height: 300px;
  background-color: white;
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -200px;
  margin-left: -200px;
  text-align: center;
}

.login-form {
  margin-top: 60px;
  margin-left: -60px;
  margin-right: 50px;
}

</style>
