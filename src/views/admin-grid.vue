<template>
  <a-layout>
    <a-breadcrumb style="background-color: white;margin-left: 5px">
      <a-breadcrumb-item><router-link to="/">首页</router-link></a-breadcrumb-item>
      <a-breadcrumb-item>菜单管理</a-breadcrumb-item>
    </a-breadcrumb>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <a-button type="primary" @click="add">
          新增
      </a-button>
      <a-table :columns="columns"
               :row-key="record => record.id"
               :data-source="gridConfigs"
               :loading="loading"
               @change="handleTableChange">
        <template #picUrl="{ record }">
          <img :src="record.picUrl" style="height: 80px;width: 80px" alt=""/>
        </template>
        <template #type="{ record }">
          <a-tag color="green" :visible="!!record.type">外部跳转</a-tag>
          <a-tag color="blue" :visible="!record.type">内部跳转</a-tag>
        </template>
        <template v-slot:action="{record}">
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
  <a-modal title="菜单项配置表单"
           v-model:visible="modalVisible"
           :confirm-loading="modalLoading"
           @ok="handleModalOk">
    <a-form ref="gridForm" :rules="gridRules" :model="gridConfig" :label-col="{ span : 6}">
      <a-form-item label="图片">
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
          <img v-if="imageUrl" :src="imageUrl" alt="" style="height: 100px;width: 100px"/>
          <div v-else>
            <loading-outlined v-if="loadingUpload"></loading-outlined>
            <plus-outlined v-else></plus-outlined>
            <div class="ant-upload-text">上传</div>
          </div>
        </a-upload>
      </a-form-item>
      <a-form-item label="名称" name="name">
        <a-input v-model:value="gridConfig.name"/>
      </a-form-item>
      <a-form-item label="顺序" name="sort">
        <a-input v-model:value="gridConfig.sort" type="number"/>
      </a-form-item>
      <a-form-item label="跳转链接">
        <a-input v-model:value="gridConfig.url"/>
      </a-form-item>
      <a-form-item label="链接类型">
        <a-select v-model:value="gridConfig.type" :allowClear=true>
          <a-select-option
              v-for="c in [{'id':true,'name':'外部跳转'},{'id':false,'name':'内部跳转'}]"
              :key="c.id"
              :value="c.id">
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
import {ExclamationCircleOutlined, LoadingOutlined, PlusOutlined} from "@ant-design/icons-vue";
import {Tool} from "@/util/tool";
import store from "@/store";
import {ValidateErrorEntity} from "ant-design-vue/es/form/interface";

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
  name: 'AdminGrid',
  components: {
    LoadingOutlined,
    PlusOutlined,
  },
  setup() {
    // 菜单项信息响应式对象
    const gridConfigs = ref();
    // 表示加载状态
    const loading = ref(false);
    // 表格列信息
    const columns = [
      {
        title: '顺序',
        dataIndex: 'sort',
      },
      {
        title: '名称',
        dataIndex: 'name',
      },
      {
        title: '图片',
        key: 'picUrl',
        slots: {customRender: 'picUrl'},
      },
      {
        title: '跳转类型',
        key: 'type',
        slots: {customRender: 'type'},
      },
      {
        title: '跳转路径',
        dataIndex: 'url',
      },
      {
        title: '操作',
        key: 'action',
        slots: {customRender: 'action'},
      }
    ];


    /**
     * 菜单项数据查询
     */
    const handleQuery = () => {
      axios.get("/api/common/grid/list").then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          gridConfigs.value = data.content;
        } else {
          message.error(data.message);
        }
      })
    };

    /**
     * 表格信息改变时激活操作
     */
    const handleTableChange = () => {
      handleQuery();
    };

    const gridForm = ref();
    const gridRules = {
      name: [
        {required: true, message: '名称不能为空', trigger: 'blur'},
        {whitespace: true, message: '名称不能为空', trigger: 'blur'}
      ],
      sort: [
        {required: true, type: 'any', message: '顺序不能为空', trigger: 'blur'},
        {whitespace: true, type: 'any', message: '顺序不能为空', trigger: 'blur'}
      ]
    }

    // 表单
    const gridConfig = ref();
    const modalVisible = ref(false);
    const modalLoading = ref(false);
    const handleModalOk = () => {
      gridForm.value.validate().then(() => {
        if (uploadImgUrl.value==="") {
          message.error("请先上传图片")
          return;
        }
        if (gridConfig.value.name===null ||gridConfig.value.name==='') {
          message.error("名称不能为空")
          return;
        }
        if (gridConfig.value.sort===null ||gridConfig.value.sort==='') {
          message.error("顺序不能为空")
          return;
        }
        gridConfig.value.picUrl = uploadImgUrl.value;
        modalLoading.value = true;
        // 编辑保存菜单项信息
        axios.post("/api/common/grid/save", gridConfig.value).then((response) => {
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


    // 新增菜单项信息方法
    const add = () => {
      modalVisible.value = true;
      gridConfig.value = {};
      uploadImgUrl.value = "";
      imageUrl.value = "";
      gridForm.value.clearValidate();
    }

    // 删除菜单项信息方法
    const handleDelete = (id: number) => {
      axios.delete("/api/common/grid/delete/" + id).then((response) => {
        const data = response.data;
        if (data.success) {
          handleQuery()
          message.success("操作成功")
        }
      })
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
      // 图片上传
      if (info.file.status === 'done') {
        getBase64(info.file.originFileObj, (base64Url: string) => {
          imageUrl.value = base64Url;
          loadingUpload.value = false;
        });
        // 接受上传结果 content中包含上传后的url
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

    const handleDeleteConfirm = (id: any) => {
      Modal.confirm({
        title: '该操作无法撤销-确认要删除吗？',
        icon: createVNode(ExclamationCircleOutlined),
        okText: '确定',
        cancelText: '取消',
        onOk() {
          axios.delete("/api/common/grid/delete/" + id).then((response) => {
            const data = response.data;
            if (data.success) {
              message.success("操作成功")
              handleQuery();
            } else {
              message.error(data.message)
            }
          })
        },
      });
    }

    // 编辑菜单项配置方法
    const edit = (record: any) => {
      modalVisible.value = true;
      gridConfig.value = Tool.copy(record)
      imageUrl.value = gridConfig.value.picUrl;
      uploadImgUrl.value = gridConfig.value.picUrl;
      gridForm.value.clearValidate();
    }

    onMounted(() => {
      handleQuery();
    });
    return {
      gridConfigs,
      gridConfig,
      loading,
      columns,
      modalVisible,
      modalLoading,
      loadingUpload,
      fileList,
      imageUrl,
      actionUrl,
      headers,
      uploadImgUrl,
      handleDeleteConfirm,
      handleTableChange,
      add,
      edit,
      handleModalOk,
      handleDelete,
      handleChange,
      beforeUpload,
      gridForm,
      gridRules
    }
  }
});

</script>

<style>
.avatar-uploader > .ant-upload {
  width: 128px;
  height: 128px;
}

.ant-upload-select-picture-card i {
  font-size: 32px;
  color: #999;
}

.ant-upload-select-picture-card .ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style>

