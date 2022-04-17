<template>
  <a-layout>
    <a-breadcrumb style="background-color: white;margin-left: 5px">
      <a-breadcrumb-item><router-link to="/">首页</router-link></a-breadcrumb-item>
      <a-breadcrumb-item>admin管理</a-breadcrumb-item>
    </a-breadcrumb>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <a-button type="primary" @click="add">
        新增
      </a-button>
      <a-table :columns="columns"
               :row-key="record => record.id"
               :data-source="admins"
               :pagination="pagination"
               :loading="loading"
               @change="handleTableChange">
        <template #superFlag="{text}">
          <label v-show="text===true">超级管理员</label>
          <label v-show="text===false">普通管理员</label>
        </template>
        <template v-slot:action="{ text, record}">
          <a-space size="small">
            <a-button type="primary" @click="edit(record)">
              编辑
            </a-button>
            <a-button type="primary" @click="handleDeleteConfirm(record.id)" danger>
              删除
            </a-button>
          </a-space>
        </template>
      </a-table>
    </a-layout-content>
  </a-layout>
  <a-modal title="管理员信息表单"
           v-model:visible="modalVisible"
           :confirm-loading="modalLoading"
           @ok="handleModalOk">
    <a-form :model="admin" :label-col="{ span : 6}">
      <a-form-item label="用户名">
        <a-input v-model:value="admin.username"/>
      </a-form-item>
      <a-form-item label="密码" v-show="!admin.id">
        <a-input v-model:value="admin.password" type="password"/>
      </a-form-item>
      <a-form-item label="身份">
        <a-select v-model:value="admin.superFlag">
          <a-select-option :value=true>超级管理员</a-select-option>
          <a-select-option :value=false>普通管理员</a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
import {createVNode, defineComponent, onMounted, ref} from 'vue';
import axios from "axios";
import {message, Modal} from 'ant-design-vue'
import {Tool} from "@/util/tool";
import {ExclamationCircleOutlined} from "@ant-design/icons-vue";

declare let hexMd5: any;
declare let KEY: any;

export default defineComponent({
  name: 'AdminSuper',
  setup() {
    // 管理员信息响应式对象
    const admins = ref();
    // 页码信息
    const pagination = ref({
      current: 1,
      pageSize: 10,
      total: 0
    });
    // 表示加载状态
    const loading = ref(false);
    // 表格列信息
    const columns = [
      {
        title: 'ID',
        dataIndex: 'id',
      },
      {
        title: '用户名',
        dataIndex: 'username',
      },
      {
        title: '身份',
        dataIndex: 'superFlag',
        slots: {customRender: 'superFlag'},
      },
      {
        title: '操作',
        key: 'action',
        slots: {customRender: 'action'},
      },
    ];

    /**
     * 数据查询
     */
    const handleQuery = (params: any) => {
      loading.value = true;
      admins.value = [];
      axios.get("/api/admin/super/list", {
        params: {
          page: params.page,
          size: params.size,
        }
      }).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          admins.value = data.content.list;
          // 重置分页按钮
          pagination.value.current = params.page;
          pagination.value.total = data.content.total;
        } else {
          message.error(data.message);
        }
      })
    };

    /**
     * 表格改变时激活操作
     */
    const handleTableChange = (pagination: any) => {
      handleQuery({
        page: pagination.current,
        size: pagination.pageSize
      });
    };

    // 表单
    const admin = ref();
    const modalVisible = ref(false);
    const modalLoading = ref(false);
    const handleModalOk = () => {
      modalLoading.value = true;
      admin.value.password = hexMd5(admin.value.password + KEY);
      // 编辑保存管理员信息
      axios.post("/api/admin/super/save", admin.value).then((response) => {
        modalLoading.value = true;
        loading.value = false;
        const data = response.data;
        if (data.success) {
          modalVisible.value = false;
          modalLoading.value = false;
          handleQuery({
            page: pagination.value.current,
            size: pagination.value.pageSize
          })
          message.success("操作成功")
        } else {
          modalLoading.value = false;
          message.error(data.message)
        }
      })
    };

    // 编辑管理员方法
    const edit = (record: any) => {
      modalVisible.value = true;
      admin.value = Tool.copy(record);
    }

    // 新增管理员方法
    const add = () => {
      modalVisible.value = true;
      admin.value = {};
    }

    // 删除管理员方法
    const handleDeleteConfirm = (id: any) => {
      Modal.confirm({
        title: '该操作无法撤销-确认要删除吗？',
        icon: createVNode(ExclamationCircleOutlined),
        okText: '确定',
        cancelText: '取消',
        onOk() {
          axios.delete("/api/admin/super/delete/" + id).then((response) => {
            const data = response.data;
            if (data.success) {
              message.success("操作成功")
              handleQuery({
                page: pagination.value.current,
                size: pagination.value.pageSize
              });
            } else {
              message.error(data.message)
            }
          })
        },
      });
    }

    onMounted(() => {
      handleQuery({
        page: pagination.value.current,
        size: pagination.value.pageSize
      });
    });
    return {
      admins,
      admin,
      loading,
      columns,
      pagination,
      modalVisible,
      modalLoading,
      handleTableChange,
      edit,
      add,
      handleModalOk,
      handleDeleteConfirm,
    }
  }
});

</script>

<style>
.search {
  width: 200px
}
</style>
