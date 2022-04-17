<template>
  <a-layout>
    <a-breadcrumb style="background-color: white;margin-left: 5px">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>
        <router-link to="/admin/course">课程管理</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>内容管理</a-breadcrumb-item>
    </a-breadcrumb>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <a-space size="small">
        <a-button type="primary" @click="addSection">
          新增章节
        </a-button>
        <br/>
      </a-space>
      <a-table :columns="columns"
               :row-key="record => record.id"
               :data-source="level1"
               :pagination="pagination"
               :loading="loading"
               bordered>
        <template #order="{record}">
          {{ record.section }}{{ record.period }}
        </template>
        <template #video="{record}">
          <div v-show="!!record.sectionId">
            <a-tag color="green" :visible="!!record.video">已上传</a-tag>
            <a-tag color="blue" :visible="!record.video">未上传</a-tag>
          </div>
        </template>
        <template v-slot:action="{text, record}">
          <a-space size="small">
            <a-button type="primary" @click="edit(record)">
              编辑
            </a-button>
            <a-button type="primary" @click="addPeriod(record.id)"
                      style="background-color: #0aa679" v-show="!record.sectionId">
              新增课时
            </a-button>
            <a-button type="primary" @click="handleDelete(record)" danger>
              删除
            </a-button>
          </a-space>
        </template>
      </a-table>
    </a-layout-content>
  </a-layout>
  <a-modal title="课时表单"
           v-model:visible="modalVisiblePeriod"
           :confirm-loading="modalLoadingPeriod"
           @ok="handleModalOkPeriod"
           @cancel="clearValidatePeriod"
  >
    <a-form
        ref="periodRef"
        :rules="periodRules"
        :model="period"
        :label-col="{ span : 6}"
    >
      <a-form-item label="标题" name="title">
        <a-input v-model:value="period.title"/>
      </a-form-item>
      <a-form-item label="课时序号" name="period">
        <a-input v-model:value="period.period" type="number"/>
      </a-form-item>
      <a-form-item label="视频内容">
        <a-upload
            v-model:file-list="fileList"
            name="file"
            list-type="picture-card"
            class="avatar-uploader"
            :multiple="true"
            :action="actionUrl"
            :before-upload="beforeUpload"
            :headers="headers"
            @preview="handlePreview"
            @change="handleChange"
        >
          <div>
            <plus-outlined/>
            <div class="ant-upload-text">
              Upload
            </div>
          </div>
          <a-modal :visible="previewVisible"
                   :destroyOnClose="true"
                   @ok="videoPreviewCancel"
                   @cancel="videoPreviewCancel"
                   width="45%">
            <video width="600" height="500" controls>
              <source :src="uploadVideoUrl" type="video/mp4"/>
              <p>您的浏览器不支持播放该视频</p>
            </video>
          </a-modal>
        </a-upload>
        <a-button v-show="!!period.video" type="primary" @click="clickPreview(period.video)">预览视频</a-button>
      </a-form-item>
      <a-form-item label="所属章节">
        <a-select
            ref="select"
            v-model:value="period.sectionId"
        >
          <a-select-option v-for="c in sections" :key="c.id" :value="c.id">
            {{ c.title }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item label="简介" name="description">
        <a-textarea v-model:value="period.description"/>
      </a-form-item>
    </a-form>
  </a-modal>
  <a-modal title="章节表单"
           v-model:visible="modalVisibleSection"
           :confirm-loading="modalLoadingSection"
           @ok="handleModalOkSection"
           @cancel="clearValidateSection"
  >
    <a-form
        ref="sectionRef"
        :rules="sectionRules"
        :model="section"
        :label-col="{ span : 6}">
      <a-form-item label="标题" name="title">
        <a-input v-model:value="section.title"/>
      </a-form-item>
      <a-form-item label="章节序号" name="section">
        <a-input v-model:value="section.section" type="number"/>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
import {createVNode, defineComponent, onMounted, ref} from 'vue';
import axios from "axios";
import {message, Modal} from 'ant-design-vue'
import {ExclamationCircleOutlined, PlusOutlined} from '@ant-design/icons-vue';
import {Tool} from "@/util/tool";
import {useRoute} from "vue-router";
import {ValidateErrorEntity} from "ant-design-vue/es/form/interface";
import store from "@/store";

function getBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

interface FileItem {
  uid: string;
  name?: string;
  status?: string;
  response?: string;
  url?: string;
  type?: string;
  size: number;
  originFileObj: any;
  percent?: number;
  preview?: string;
}

interface FileInfo {
  file: FileItem;
  fileList: FileItem[];
}

export default defineComponent({
  name: 'AdminContent',
  components: {
    PlusOutlined,
  },
  setup() {
    // 路由对象 用于获取queryId
    const route = useRoute();
    // 课时信息响应式对象
    const periods = ref();
    // 章节信息响应式对象
    const sections = ref();
    // 表示加载状态
    const loading = ref(false);
    // 上传的视频url
    const uploadVideoUrl = ref();
    // 页码信息
    const pagination = ref({
      current: 1,
      pageSize: 10,
      total: 0
    });
    // 表格列信息
    const columns = [
      {
        title: '序号',
        key: 'order',
        slots: {customRender: 'order'},
      },
      {
        title: '标题',
        dataIndex: 'title',
      },
      {
        title: '简介',
        dataIndex: 'description',
      },
      {
        title: '视频状态',
        key: 'video',
        slots: {customRender: 'video'},
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
    const handleQuery = async (params: any) => {
      await axios.get("/api/admin/course-section/list", {
        params: {
          courseId: route.query.courseId,
          page: params.page,
          size: params.size
        }
      }).then((response) => {
        const data = response.data;
        if (data.success) {
          sections.value = data.content.list;
        } else {
          message.error(data.message);
        }
      }).then(() => {
        loading.value = true;
        axios.get("/api/admin/course-period/list", {
          params: {
            courseId: route.query.courseId,
            page: params.page,
            size: params.size
          }
        }).then((response) => {
          loading.value = false;
          const data = response.data;
          if (data.success) {
            level1.value = [];
            if (Object.keys(sections.value).length > 0) {
              level1.value = Tool.content2Tree(data.content.list, sections.value);
            }
            // 重置分页按钮
            pagination.value.current = params.page;
            pagination.value.total = data.content.total;
          } else {
            message.error(data.message);
          }
        })
      })
    };

    // 章节表单校验规则
    const sectionRules = {
      title: [
        {required: true, message: '标题字段不能为空', trigger: 'blur'},
        {whitespace: true, message: '标题字段不能为空', trigger: 'blur'}
      ],
      section: [{required: true, message: '序号字段不能为空', trigger: 'blur'}],
    };

    // 章节表单
    const sectionRef = ref();
    const section = ref();
    const modalVisibleSection = ref(false);
    const modalLoadingSection = ref(false);
    const handleModalOkSection = () => {
      sectionRef.value.validate().then(() => {
        modalLoadingSection.value = true;
        section.value.courseId = route.query.courseId;
        // 编辑保存章节
        axios.post("/api/admin/course-section/save", section.value).then((response) => {
          loading.value = false;
          const data = response.data;
          if (data.success) {
            modalVisibleSection.value = false;
            modalLoadingSection.value = false;
            message.success("操作成功")
            handleQuery({
              page: pagination.value.current,
              size: pagination.value.pageSize
            });
          } else {
            modalLoadingSection.value = false;
            message.error(data.message)
          }
        })
      }).catch((error: ValidateErrorEntity) => {
        console.log('error', error);
      });
    };

    // 清除表单校验结果
    const clearValidateSection = () => {
      sectionRef.value.clearValidate();
    };

    // 课时表单校验规则
    const periodRules = {
      title: [
        {required: true, message: '标题字段不能为空', trigger: 'blur'},
        {whitespace: true, message: '标题字段不能为空', trigger: 'blur'}
      ],
      period: [{required: true, message: '序号字段不能为空', trigger: 'blur'}],
      description: [
        {required: true, message: '简介字段不能为空', trigger: 'blur'},
        {whitespace: true, message: '简介字段不能为空', trigger: 'blur'}
      ],
    };
    // 课时表单
    const period = ref();
    const periodRef = ref();
    const modalVisiblePeriod = ref(false);
    const modalLoadingPeriod = ref(false);
    const handleModalOkPeriod = () => {
      periodRef.value.validate().then(() => {
        modalLoadingPeriod.value = true;
        period.value.video = uploadVideoUrl.value;
        period.value.courseId = route.query.courseId;
        period.value.price = 0;
        // 编辑保存章节
        axios.post("/api/admin/course-period/save", period.value).then((response) => {
          modalLoadingPeriod.value = true;
          loading.value = false;
          const data = response.data;
          if (data.success) {
            modalVisiblePeriod.value = false;
            modalLoadingPeriod.value = false;
            message.success("操作成功")
            handleQuery({
              page: pagination.value.current,
              size: pagination.value.pageSize
            });
          } else {
            modalLoadingPeriod.value = false;
            message.error(data.message)
          }
        })
      }).catch((error: ValidateErrorEntity) => {
        console.log('error', error);
      });
    };

    // 清除表单校验结果
    const clearValidatePeriod = () => {
      periodRef.value.clearValidate();
    };

    // 编辑方法
    const edit = (record: any) => {
      if (!record.sectionId) {
        section.value = Tool.copy(record);
        section.value.section = String(section.value.section);
        modalVisibleSection.value = true;
      } else {
        period.value = Tool.copy(record);
        period.value.period = String(period.value.period);
        period.value.price = String(period.value.price);
        if (!period.value.video) {
          uploadVideoUrl.value = period.value.video;
        } else {
          fileList.value = [];
        }
        modalVisiblePeriod.value = true;
      }
    }

    // 新增章节方法
    const addSection = () => {
      modalVisibleSection.value = true;
      section.value = {};
    }

    // 新增课时方法
    const addPeriod = (sectionId: any) => {
      modalVisiblePeriod.value = true;
      period.value = {};
      period.value.sectionId = sectionId;
      uploadVideoUrl.value = null;
      fileList.value = [];
    }

    // 删除方法
    const handleDelete = (record: any) => {
      Modal.confirm({
        title: '该操作无法撤销-确认要删除吗？',
        icon: createVNode(ExclamationCircleOutlined),
        okText: '确定',
        cancelText: '取消',
        onOk() {
          const url = !record.sectionId ? "course-section" : "course-period";
          axios.delete("/api/admin/" + url + "/delete/" + record.id).then((response) => {
            const data = response.data;
            if (data.success) {
              message.success("操作成功")
              handleQuery({
                page: pagination.value.current,
                size: pagination.value.pageSize
              });
            }
          })
        }
      })
    }

    // 上传视频的方法
    const previewVisible = ref<boolean>(false);
    const previewVideo = ref<string | undefined>('');
    const fileList = ref<FileItem[]>([]);
    const videoUrl = ref<string>('');
    const loadingUpload = ref<boolean>(false);
    const actionUrl = ref();
    const headers = ref();
    headers.value = {
      'satoken': store.state.user.token,
    };
    actionUrl.value = process.env.VUE_APP_SERVER + "/api/admin/upload/upload-video";
    const handleChange = (info: FileInfo) => {
      if (info.file.status === 'uploading') {
        loadingUpload.value = true;
        return;
      }
      if (info.file.status === 'done') {
        const res = JSON.parse(JSON.stringify(info.file.response));
        if (res.success) {
          console.log(info);
          console.log(info.file);
          fileList.value[0] = info.file;
          fileList.value[0].url = "https://ucloudteach.obs.cn-north-4.myhuaweicloud.com/1911933ecbf02be280a9a44a54e5ca24.png"
          loadingUpload.value = false;
          message.success("视频上传成功");
          uploadVideoUrl.value = res.content;
        } else {
          message.error(res.message)
        }

      }
      if (info.file.status === 'error') {
        loadingUpload.value = false;
        message.error('上传失败');
      }
    }

    const beforeUpload = (file: FileItem) => {
      const typeCheck = file.type === 'video/x-msvideo' || file.type === 'video/mp4' || file.type === 'flv-application/octet-stream';
      if (!typeCheck) {
        message.error('只允许上传MP4/AVI/FLV格式文件!');
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('只允许上传小于10MB的视频');
      }
      return typeCheck && isLt10M;
    };

    const handlePreview = (file: FileItem) => {
      //预览视频
      previewVisible.value = true;
    };
    const videoPreviewCancel = () => {
      previewVisible.value = false;
    }

    // 点击预览已存在视频
    const clickPreview = (url: string) => {
      uploadVideoUrl.value = url;
      previewVisible.value = true;
    }

    onMounted(() => {
      handleQuery({
        page: pagination.value.current,
        size: pagination.value.pageSize
      });
    });
    return {
      periods,
      period,
      loading,
      columns,
      modalVisibleSection,
      modalLoadingSection,
      modalVisiblePeriod,
      modalLoadingPeriod,
      sections,
      section,
      pagination,
      sectionRules,
      sectionRef,
      periodRules,
      periodRef,
      loadingUpload,
      fileList,
      videoUrl,
      actionUrl,
      headers,
      uploadVideoUrl,
      previewVisible,
      previewVideo,
      clickPreview,
      videoPreviewCancel,
      handlePreview,
      clearValidateSection,
      clearValidatePeriod,
      edit,
      addPeriod,
      addSection,
      handleModalOkSection,
      handleModalOkPeriod,
      handleDelete,
      handleChange,
      beforeUpload,
      level1
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