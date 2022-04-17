<template>
  <a-layout>
    <a-breadcrumb style="background-color: white;margin-left: 5px">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>科目管理</a-breadcrumb-item>
    </a-breadcrumb>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <a-space size="small">
        <a-button type="primary" @click="add">
          新增
        </a-button>
      </a-space>
      <a-table :columns="columns"
               :row-key="record => record.id"
               :data-source="level1"
               :loading="loading"
               :pagination="false">
        <template v-slot:action="{text, record}">
          <a-space size="small" v-show="!record.order">
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
  <a-modal title="科目表单"
           v-model:visible="modalVisible"
           :confirm-loading="modalLoading"
           @ok="handleModalOk">
    <a-form ref="subjectForm" :rules="subjectRules" :model="subject" :label-col="{ span : 6}">
      <a-form-item label="名称" name="name">
        <a-input v-model:value="subject.name"/>
      </a-form-item>
      <a-form-item label="所属年级" name="gradeId">
        <a-select
            ref="select"
            v-model:value="subject.gradeId"
        >
          <a-select-option v-for="c in grades" :key="c.id" :value="c.id" :disabled="c.id===String(subject.gradeId)">
            {{ c.name }}
          </a-select-option>
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
import {ValidateErrorEntity} from "ant-design-vue/es/form/interface";
import {ExclamationCircleOutlined} from "@ant-design/icons-vue";

export default defineComponent({
  name: 'AdminSubject',
  setup() {
    // 科目信息响应式对象
    const subjects = ref();
    // 年级信息响应式对象
    const grades = ref();
    // 表示加载状态
    const loading = ref(false);
    // 表格列信息
    const columns = [
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

    const level1 = ref();
    /**
     * 数据查询
     */
    const handleQuery = async () => {
      await axios.get("/api/admin/grade/list").then((response) => {
        const data = response.data;
        if (data.success) {
          grades.value = data.content;
        } else {
          message.error(data.message);
        }
      }).then(() => {
        loading.value = true;
        axios.get("/api/admin/subject/list").then((response) => {
          loading.value = false;
          const data = response.data;
          if (data.success) {
            level1.value = [];
            level1.value = Tool.subject2Tree(data.content, grades.value);
          } else {
            message.error(data.message);
          }
        })
      })
    };

    const subjectForm = ref();
    const subjectRules = {
      name: [
        {required: true, message: '名称不能为空', trigger: 'blur'},
        {whitespace: true, message: '名称不能为空', trigger: 'blur'}
      ],
      gradeId: [
        {required: true, type: 'any', message: '所属年级不能为空', trigger: 'blur'},
        {whitespace: true, type: 'any', message: '所属年级不能为空', trigger: 'blur'}
      ]
    }

    // 表单
    const subject = ref();
    const modalVisible = ref(false);
    const modalLoading = ref(false);
    const handleModalOk = () => {
      subjectForm.value.validate().then(() => {
        modalLoading.value = true;
        // 编辑保存科目
        axios.post("/api/admin/subject/save", subject.value).then((response) => {
          modalLoading.value = true;
          loading.value = false;
          const data = response.data;
          if (data.success) {
            modalVisible.value = false;
            modalLoading.value = false;
            message.success("操作成功")
            handleQuery();
          } else {
            modalLoading.value = false;
            message.error(data.message)
          }
        })
      }).catch((error: ValidateErrorEntity) => {
        console.log('error', error);
      });
    };

    // 编辑科目方法
    const edit = (record: any) => {
      modalVisible.value = true;
      subject.value = Tool.copy(record);
      subjectForm.value.clearValidate();
    }

    // 新增科目方法
    const add = () => {
      modalVisible.value = true;
      subject.value = {};
      subjectForm.value.clearValidate();
    }

    // 删除科目方法
    const handleDelete = (id: number) => {
      Modal.confirm({
        title: '该操作无法撤销-确认要删除吗？',
        icon: createVNode(ExclamationCircleOutlined),
        okText: '确定',
        cancelText: '取消',
        onOk() {
          axios.delete("/api/admin/subject/delete/" + id).then((response) => {
            const data = response.data;
            if (data.success) {
              message.success("操作成功")
              handleQuery();
            }
          })
        }
      })
    }

    onMounted(() => {
      handleQuery();
    });
    return {
      subjects,
      subject,
      loading,
      columns,
      modalVisible,
      modalLoading,
      grades,
      edit,
      add,
      handleModalOk,
      handleDelete,
      level1,
      subjectForm,
      subjectRules
    }
  }
});

</script>
