<template>
  <a-layout>
    <a-breadcrumb style="background-color: white;margin-left: 5px">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>学员管理</a-breadcrumb-item>
    </a-breadcrumb>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <a-form
          layout="horizontal"
          :model="searchStu"
      >
        <a-form-item>
          <a-row>
            <a-col :span="6">
              <label>姓名：</label>
              <a-input v-model:value="searchStu.name" placeholder="按姓名查询"></a-input>
            </a-col>
            <a-col :span="2"></a-col>
            <a-col :span="6">
              <label>性别：</label>
              <a-select v-model:value="searchStu.gender" placeholder="按性别查询" :allowClear=true>
                <a-select-option :value=false>女</a-select-option>
                <a-select-option :value=true>男</a-select-option>
              </a-select>
            </a-col>
            <a-col :span="2"></a-col>
            <a-col :span="6">
              <label>状态：</label>
              <a-select v-model:value="searchStu.disableFlag" placeholder="按状态查询" :allowClear=true>
                <a-select-option :value=false>正常</a-select-option>
                <a-select-option :value=true>封禁</a-select-option>
              </a-select>
            </a-col>
          </a-row>
        </a-form-item>
        <a-form-item style="text-align: center">
          <a-space size="middle">
            <a-button type="primary" @click="handleQueryByCondition({page:1, size: pagination.pageSize})">
              查询
            </a-button>
            <a-button type="primary" @click="add">
              新增
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
      <br/>
      <a-table :columns="columns"
               :row-key="record => record.id"
               :data-source="students"
               :pagination="pagination"
               :loading="loading"
               @change="handleTableChange">
        <template v-slot:headPic="{ text:record }">
          <img v-if="record.headPic" :src="record.headPic" style="height: 50px;width: 50px" alt=""/>
        </template>
        <template #gender="{text}">
          <label v-show="text===true">男</label>
          <label v-show="text===false">女</label>
        </template>
        <template #disableFlag="{text}">
          <label v-show="text===true">封禁</label>
          <label v-show="text===false">正常</label>
        </template>
        <template v-slot:action="{ text, record}">
          <a-space size="small">
            <a-button type="primary" @click="resetPassword(record)">
              重置密码
            </a-button>
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
  <a-modal title="学员信息表单"
           v-model:visible="modalVisible"
           :confirm-loading="modalLoading"
           @ok="handleModalOk">
    <a-form ref="studentForm" :rules="studentRules" :model="student" :label-col="{ span : 6}">
      <a-form-item label="手机号" name="phone">
        <a-input v-model:value="student.phone" :disabled="!!student.id"/>
      </a-form-item>
      <a-form-item label="姓名" name="name">
        <a-input v-model:value="student.name"/>
      </a-form-item>
      <a-form-item label="性别" name="gender">
        <a-select v-model:value="student.gender">
          <a-select-option :value=true>男</a-select-option>
          <a-select-option :value=false>女</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="头像">
        <a-upload
            v-model:file-list="fileList"
            name="file"
            list-type="picture-card"
            class="avatar-uploader"
            :show-upload-list="false"
            :multiple="true"
            :action="actionUrl"
            :before-upload="beforeUpload"
            :headers="headers"
            @change="handleChange"
        >
          <img v-if="imageUrl" :src="imageUrl" alt="avatar" style="height: 100px;width: 100px"/>
          <div v-else>
            <loading-outlined v-if="loadingUpload"></loading-outlined>
            <plus-outlined v-else></plus-outlined>
            <div class="ant-upload-text">上传</div>
          </div>
        </a-upload>
      </a-form-item>
      <a-form-item label="密码" v-show="!student.id" name="password">
        <a-input v-model:value="student.password" type="password"/>
      </a-form-item>
      <a-form-item label="状态" v-show="!!student.id">
        <a-select v-model:value="student.disableFlag">
          <a-select-option :value=false>正常</a-select-option>
          <a-select-option :value=true>封禁</a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>

  <a-modal title="重置密码"
           v-model:visible="resetModalVisible"
           :confirm-loading="resetModalLoading"
           @ok="handleResetModalOk">
    <a-form :model="student" :label-col="{ span : 6}">
      <a-form-item label="新密码">
        <a-input v-model:value="student.password"/>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
import {createVNode, defineComponent, onMounted, ref} from 'vue';
import axios from "axios";
import {message, Modal} from 'ant-design-vue'
import {Tool} from "@/util/tool";
import store from "@/store";
import {ValidateErrorEntity} from "ant-design-vue/es/form/interface";
import {ExclamationCircleOutlined} from "@ant-design/icons-vue";

declare let hexMd5: any;
declare let KEY: any;


interface FileItem {
  uid: string;
  name?: string;
  status?: string;
  response?: string;
  url?: string;
  type?: string;
  size: number;
  originFileObj: any;
}

interface FileInfo {
  file: FileItem;
  fileList: FileItem[];
}

function getBase64(img: Blob, callback: (base64Url: string) => void) {
  const reader = new FileReader();
  reader.addEventListener('load', () => callback(reader.result as string));
  reader.readAsDataURL(img);
}

export default defineComponent({
  name: 'AdminStu',
  setup() {
    // 学员信息响应式对象
    const students = ref();
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
        title: '头像',
        key: 'headPic',
        slots: {customRender: 'headPic'},
      },
      {
        title: '手机号',
        dataIndex: 'phone',
      },
      {
        title: '姓名',
        dataIndex: 'name',
      },
      {
        title: '性别',
        dataIndex: 'gender',
        slots: {customRender: 'gender'},
      },
      {
        title: '状态',
        dataIndex: 'disableFlag',
        slots: {customRender: 'disableFlag'},
      },
      {
        title: '操作',
        key: 'action',
        slots: {customRender: 'action'},
      },
    ];
    // 学员信息查询对象
    const searchStu = ref();
    searchStu.value = {}
    /**
     * 数据查询
     */
    const handleQuery = (params: any) => {
      loading.value = true;
      students.value = [];
      axios.get("/api/admin/stu/list", {
        params: {
          page: params.page,
          size: params.size,
        }
      }).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          students.value = data.content.list;
          // 重置分页按钮
          pagination.value.current = params.page;
          pagination.value.total = data.content.total;
        } else {
          message.error(data.message);
        }
      })
    };

    /**
     * 根据loginName查询学员信息
     */
    const handleQueryByCondition = (params: any) => {
      loading.value = true;
      students.value = [];
      axios.get("/api/admin/stu/search", {
        params: {
          page: params.page,
          size: params.size,
          name: searchStu.value.name,
          gender: searchStu.value.gender,
          disableFlag: searchStu.value.disableFlag
        }
      }).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          students.value = data.content.list;
          // 重置分页按钮
          pagination.value.current = params.page;
          pagination.value.total = data.content.total;
        } else {
          message.error(data.message);
        }

      })
    };
    /**
     * 表格点击页面时激活操作
     */
    const handleTableChange = (pagination: any) => {
      handleQuery({
        page: pagination.current,
        size: pagination.pageSize
      });
    };

    const studentForm = ref();

    const studentRules = {
      name: [
        {required: true, message: '姓名不能为空', trigger: 'blur'},
        {whitespace: true, message: '姓名不能为空', trigger: 'blur'}],
      phone: [
        {required: true, message: '手机号不能为空', trigger: 'blur'},
        {pattern: '^1[3-9][0-9]{9}$', message: '手机号不合法', trigger: 'blur'}
      ],
      gender: [{required: true, type: 'any', message: '性别不能为空', trigger: 'blur'}],
      password: [
        {required: true, type: 'any', message: '密码不能为空', trigger: 'blur'},
        {whitespace: true, message: '密码不能为空', trigger: 'blur'}],
    };

    // 表单
    const student = ref();
    const modalVisible = ref(false);
    const modalLoading = ref(false);
    const handleModalOk = () => {
      studentForm.value.validate().then(() => {
        modalLoading.value = true;
        student.value.headPic = uploadImgUrl.value;
        student.value.password = hexMd5(student.value.password + KEY);
        // 编辑保存学员信息
        axios.post("/api/admin/stu/save", student.value).then((response) => {
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
      }).catch((error: ValidateErrorEntity) => {
        console.log('error', error);
      });
    };


    // 删除学员信息方法
    const handleDelete = (id: number) => {
      Modal.confirm({
        title: '该操作无法撤销-确认要删除吗？',
        icon: createVNode(ExclamationCircleOutlined),
        okText: '确定',
        cancelText: '取消',
        onOk() {
          axios.delete("/api/admin/stu/delete/" + id).then((response) => {
            const data = response.data;
            if (data.success) {
              handleQuery({
                page: pagination.value.current,
                size: pagination.value.pageSize
              })
              message.success("操作成功")
            }
          })
        },
      });
    }

    // 重置密码表单
    const resetModalVisible = ref(false);
    const resetModalLoading = ref(false);
    const handleResetModalOk = () => {
      resetModalLoading.value = true;
      student.value.password = hexMd5(student.value.password + KEY);
      // 编辑保存学员信息
      axios.post("/api/admin/stu/resetPassword", student.value).then((response) => {
        resetModalLoading.value = true;
        loading.value = false;
        const data = response.data;
        if (data.success) {
          resetModalVisible.value = false;
          resetModalLoading.value = false;
          handleQuery({
            page: pagination.value.current,
            size: pagination.value.pageSize
          })
          message.success("操作成功")
        } else {
          resetModalLoading.value = false;
          message.error(data.message)
        }
      })
    };

    // 重置用户密码方法
    const resetPassword = (record: any) => {
      resetModalVisible.value = true;
      student.value = Tool.copy(record);
      student.value.password = '';
    }

    // 上传图片的方法
    const fileList = ref([]);
    const imageUrl = ref<string>('');
    const loadingUpload = ref<boolean>(false);
    const actionUrl = ref();
    const headers = ref();
    const uploadImgUrl = ref();
    headers.value = {
      'satoken': store.state.user.token,
    };
    actionUrl.value = process.env.VUE_APP_SERVER + "/api/admin/upload/upload-pic";
    const handleChange = (info: FileInfo) => {
      if (info.file.status === 'uploading') {
        loadingUpload.value = true;
        return;
      }
      if (info.file.status === 'done') {
        // Get this url from response in real world.
        getBase64(info.file.originFileObj, (base64Url: string) => {
          imageUrl.value = base64Url;
          loadingUpload.value = false;
        });
        const res = JSON.parse(JSON.stringify(info.file.response));
        if (res.success) {
          message.success("图片上传成功");
          uploadImgUrl.value = res.content;
        } else {
          message.error(res.message)
        }

      }
      if (info.file.status === 'error') {
        loadingUpload.value = false;
        message.error('上传失败');
      }
    };

    const beforeUpload = (file: FileItem) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('只允许上传JPG/PNG格式文件!');
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('只允许上传小于10MB的图片');
      }
      return isJpgOrPng && isLt10M;
    };

    // 编辑学员信息方法
    const edit = (record: any) => {
      modalVisible.value = true;
      student.value = Tool.copy(record);
      imageUrl.value = student.value.headPic;
      uploadImgUrl.value = student.value.headPic;
      studentForm.value.clearValidate();
    }

    // 新增学员信息方法
    const add = () => {
      modalVisible.value = true;
      student.value = {};
      uploadImgUrl.value = "";
      imageUrl.value = "";
      studentForm.value.clearValidate();
    }

    onMounted(() => {
      handleQuery({
        page: pagination.value.current,
        size: pagination.value.pageSize
      });
    });
    return {
      students,
      student,
      loading,
      columns,
      pagination,
      modalVisible,
      modalLoading,
      searchStu,
      resetModalLoading,
      resetModalVisible,
      handleTableChange,
      edit,
      add,
      handleModalOk,
      handleDelete,
      handleQueryByCondition,
      resetPassword,
      handleResetModalOk,
      loadingUpload,
      fileList,
      imageUrl,
      actionUrl,
      headers,
      uploadImgUrl,
      handleChange,
      beforeUpload,
      studentForm,
      studentRules
    }
  }
});

</script>

<style>
.search {
  width: 200px
}
</style>
