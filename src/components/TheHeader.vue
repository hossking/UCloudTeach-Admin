<template>
  <a-layout-header style="background: #fff; padding: 0;text-align: center">
    <a-row>
      <a-col span="18">
        <div style="font-size: 30px;margin-left: 30%">优云教后台管理系统</div>
      </a-col>
      <a-col span="6">
        <div style="margin-right: 40px;text-align: right;">
          <a-dropdown>
            <a-avatar size="large" style="background-color: #1890ff;">
              <template #icon>
                <UserOutlined/>
              </template>
            </a-avatar>
            <template #overlay>
              <a-menu>
                <a-menu-item>
                  <a-button type="link" @click="logout">
                    退出
                  </a-button>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <label style="font-size: 15px;margin-left: 8px;margin-top: 20px">{{ username }}</label>
        </div>
      </a-col>
    </a-row>
  </a-layout-header>
</template>

<script>
import {defineComponent, ref} from "vue";
import {UserOutlined} from '@ant-design/icons-vue';
import store from "@/store";
import axios from "axios";
import {message} from "ant-design-vue";

export default defineComponent({
  name: 'TheHeader',
  components: {
    UserOutlined
  },
  setup() {
    const username = ref();
    username.value = store.state.user.username;
    const logout = () => {
      if (store.state.user.token) {
        axios.get("/api/admin/logout").then((response) => {
          const data = response.data;
          if (data.success) {
            message.success("注销成功");
          }
        })
      }
      window.location.href = "/admin/login"
    };

    return {
      username,
      logout,
    }
  }
})
</script>

<style scoped>

</style>