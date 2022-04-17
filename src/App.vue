<template>
  <a-layout style="min-height: 100vh">
    <!-- 登录页不显示公共菜单   -->
    <the-menu v-show="$route.name!=='Login'"/>
    <a-layout>
      <the-header v-show="$route.name!=='Login'"/>
      <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" v-if="$route.name==='AdminCourse' || $route.name==='AdminPaper'" :key="$route.path"/>
          </keep-alive>
          <component :is="Component" v-if="$route.name!=='AdminCourse' && $route.name!=='AdminPaper'" :key="$route.path+'normal'"/>
      </router-view>
      <the-footer v-show="$route.name!=='Login'"/>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import {defineComponent} from "vue";
import TheMenu from "@/components/TheMenu.vue";
import TheHeader from "@/components/TheHeader.vue";
import TheFooter from "@/components/TheFooter.vue";


export default defineComponent({
  components: {
    TheMenu,
    TheHeader,
    TheFooter,
  }
})
</script>

<style>

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a {
  color: #42b983;
}
</style>
