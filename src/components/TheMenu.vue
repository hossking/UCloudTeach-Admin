<template>
  <a-layout-sider collapsible>
    <br/><br/>
    <a-menu theme="dark" mode="inline">
      <a-menu-item key="/">
        <router-link to="/">
          <HomeOutlined />
          <span>首页</span>
        </router-link>

      </a-menu-item>
      <a-sub-menu key="sub1">
        <template #title>
            <span>
              <team-outlined/>
              <span>教学管理</span>
            </span>
        </template>
        <a-menu-item key="1">
          <router-link to="/admin/stu">学员管理</router-link>
        </a-menu-item>
        <a-menu-item key="2">
          <router-link to="/admin/grade">年级管理</router-link>
        </a-menu-item>
        <a-menu-item key="3">
          <router-link to="/admin/subject">科目管理</router-link>
        </a-menu-item>
        <a-menu-item key="4">
          <router-link to="/admin/course">课程管理</router-link>
        </a-menu-item>
      </a-sub-menu>
      <a-sub-menu key="sub2">
        <template #title>
            <span>
              <ProfileOutlined />
              <span>试题管理</span>
            </span>
        </template>
        <a-menu-item key="5">
          <router-link to="/admin/question">题目管理</router-link>
        </a-menu-item>
        <a-menu-item key="6">
          <router-link to="/admin/question/edit">添加题目</router-link>
        </a-menu-item>
        <a-menu-item key="7">
          <router-link to="/admin/paper">试卷管理</router-link>
        </a-menu-item>
        <a-menu-item key="8">
          <router-link to="/admin/exam">考试管理</router-link>
        </a-menu-item>
      </a-sub-menu>
      <a-sub-menu key="sub3">
        <template #title>
            <span>
              <FormatPainterOutlined />
              <span>页面装修</span>
            </span>
        </template>
        <a-menu-item key="9">
          <router-link to="/admin/config/swipe">轮播图</router-link>
        </a-menu-item>
        <a-menu-item key="10">
          <router-link to="/admin/config/grid">菜单项</router-link>
        </a-menu-item>
      </a-sub-menu>
      <a-sub-menu key="sub4" v-if="flag">
        <template #title>
            <span>
              <SettingOutlined />
              <span>系统设置</span>
            </span>
        </template>
        <a-menu-item key="11">
          <router-link to="/admin/super" v-if="flag">管理员设置</router-link>
        </a-menu-item>
      </a-sub-menu>
    </a-menu>
  </a-layout-sider>
</template>

<script lang="ts">
import {computed, defineComponent, onMounted, ref} from 'vue';
import {HomeOutlined,FieldTimeOutlined,SettingOutlined,FormatPainterOutlined,ProfileOutlined,DesktopOutlined, PieChartOutlined, TeamOutlined, UserOutlined} from "@ant-design/icons-vue";
import store from "@/store";

export default defineComponent({
  name: 'TheMenu',
  components: {
    PieChartOutlined,
    UserOutlined,
    TeamOutlined,
    DesktopOutlined,
    ProfileOutlined,
    FormatPainterOutlined,
    SettingOutlined,
    FieldTimeOutlined,
    HomeOutlined,
  },
  setup() {
    let flag = store.state.user.superFlag;

    return {
      flag,
    }
  }
});
</script>

<style scoped>

</style>