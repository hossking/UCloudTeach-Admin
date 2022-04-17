<template>
  <a-layout>
    <a-breadcrumb style="background-color: white;margin-left: 5px">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>年级管理</a-breadcrumb-item>
    </a-breadcrumb>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <a-button type="primary" @click="add">
        新增
      </a-button>
      <br/>
      <a-table :columns="columns"
               :row-key="record => record.id"
               :data-source="grades"
               :loading="loading"
               @change="handleTableChange">
        <template v-slot:action="{record}">
          <a-space size="small">
            <a-button type="primary" @click="edit(record)">
              编辑
            </a-button>
            <a-button type="primary" @click="handleDelete(record.id)" danger>
              删除
            </a-button>
          </a-space>
        </template>
      </a-table>
    </a-layout-content>
  </a-layout>
  <a-modal title="年级信息表单"
           v-model:visible="modalVisible"
           :confirm-loading="modalLoading"
           @ok="handleModalOk">
    <a-form ref="gradeForm" :rules="gradeRules" :model="grade" :label-col="{ span : 6}">
      <a-form-item label="名称" name="name">
        <a-input v-model:value="grade.name"/>
      </a-form-item>
      <a-form-item label="排序权重" name="order">
        <a-input v-model:value="grade.order"/>
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
import {ValidateErrorEntity} from "ant-design-vue/es/form/interface";

export default defineComponent({
  name: 'AdminGrade',
  setup() {
    // 年级信息响应式对象
    const grades = ref();
    // 表示加载状态
    const loading = ref(false);
    // 表格列信息
    const columns = [
      {
        title: 'ID',
        dataIndex: 'id',
      },
      {
        title: '名称',
        dataIndex: 'name',
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
    const handleQuery = () => {
      loading.value = true;
      grades.value = [];
      axios.get("/api/admin/grade/list").then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          grades.value = data.content;
        } else {
          message.error(data.message);
        }
      })
    };

    /**
     * 表格点击页面时激活操作
     */
    const handleTableChange = () => {
      handleQuery();
    };

    const gradeForm = ref();
    const gradeRules = {
      name: [
        {required: true, message: '名称不能为空', trigger: 'blur'},
        {whitespace: true, message: '名称不能为空', trigger: 'blur'}
      ],
      order: [
        {required: true, type: 'any', message: '排序权重不能为空', trigger: 'blur'},
        {whitespace: true, type: 'any', message: '排序权重不能为空', trigger: 'blur'}
      ]
    }

    // 表单
    const grade = ref();
    const modalVisible = ref(false);
    const modalLoading = ref(false);
    const handleModalOk = () => {
      gradeForm.value.validate().then(() => {
        modalLoading.value = true;
        // 编辑保存年级信息
        axios.post("/api/admin/grade/save", grade.value).then((response) => {
          modalLoading.value = true;
          loading.value = false;
          const data = response.data;
          if (data.success) {
            modalVisible.value = false;
            modalLoading.value = false;
            handleQuery()
            message.success("操作成功")
          } else {
            modalLoading.value = false;
            message.error(data.message)
          }
        })
      }).catch((error: ValidateErrorEntity) => {
        console.log('error', error);
      });
    };

    // 编辑年级信息方法
    const edit = (record: any) => {
      modalVisible.value = true;
      grade.value = Tool.copy(record);
      gradeForm.value.clearValidate();
    }

    // 新增年级信息方法
    const add = () => {
      modalVisible.value = true;
      grade.value = {};
      gradeForm.value.clearValidate();
    }

    // 删除年级信息方法
    const handleDelete = (id: number) => {
      Modal.confirm({
        title: '该操作无法撤销-确认要删除吗？',
        icon: createVNode(ExclamationCircleOutlined),
        okText: '确定',
        cancelText: '取消',
        onOk() {
          axios.delete("/api/admin/grade/delete/" + id).then((response) => {
            const data = response.data;
            if (data.success) {
              handleQuery();
              message.success("操作成功");
            }
          })
        },
      });
    }


    onMounted(() => {
      handleQuery();
    });
    return {
      grades,
      grade,
      loading,
      columns,
      modalVisible,
      modalLoading,

      handleTableChange,
      edit,
      add,
      handleModalOk,
      handleDelete,
      gradeRules,
      gradeForm
    }
  }
});

</script>