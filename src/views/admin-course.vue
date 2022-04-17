<template>
  <a-layout>
    <a-breadcrumb style="background-color: white;margin-left: 5px">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>课程管理</a-breadcrumb-item>
    </a-breadcrumb>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <a-form
          layout="horizontal"
          :model="searchCourse"
      >
        <a-form-item>
          <a-row>
            <a-col :span="6">
              <label>名称：</label>
              <a-input v-model:value="searchCourse.name" placeholder="按名称查询"></a-input>
            </a-col>
            <a-col :span="2"></a-col>
            <a-col :span="6">
              <label>讲师：</label>
              <a-input v-model:value="searchCourse.teacher" placeholder="按课程讲师查询"></a-input>
            </a-col>
            <a-col :span="2"></a-col>
            <a-col :span="6">
              <label>状态：</label>
              <a-select v-model:value="searchCourse.status" placeholder="按状态查询" :allowClear=true>
                <a-select-option value=false>已下架</a-select-option>
                <a-select-option value=true>已上架</a-select-option>
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
               :data-source="courses"
               :pagination="pagination"
               :loading="loading"
               @change="handleTableChange">
        <template v-slot:cover="{ record }">
          <img v-if="record.cover" :src="record.cover" style="height: 50px;width: 50px" alt=""/>
        </template>
        <template #subject="{text}">
          {{ gradeMap.get(sgMap.get(text)) }}
          {{ subjectMap.get(text) }}
        </template>
        <template #status="{text}">
          <a-tag color="blue" :visible="text===true">已上架</a-tag>
          <a-tag color="green" :visible="text===false">已下架</a-tag>
        </template>
        <template v-slot:action="{record}">
          <a-dropdown>
            <template #overlay>
              <a-menu>
                <a-menu-item key="edit">
                  <a-button type="link" size="small" @click="edit(record)">
                    编辑
                  </a-button>
                </a-menu-item>
                <a-menu-item key="delete">
                  <a-button type="link" size="small" @click="handleDelete(record.id)" danger>
                    删除
                  </a-button>
                </a-menu-item>
                <a-menu-item key="member">
                  <router-link :to="'/admin/course/member?courseId=' + record.id">
                    <a-button type="link" size="small">
                      学员管理
                    </a-button>
                  </router-link>
                </a-menu-item>
                <a-menu-item key="content">
                  <router-link :to="'/admin/content?courseId=' + record.id">
                    <a-button type="link" size="small">
                      内容管理
                    </a-button>
                  </router-link>
                </a-menu-item>
                <a-menu-item key="comment">
                  <router-link :to="'/admin/course/comment?courseId=' + record.id">
                    <a-button type="link" size="small">
                      评论管理
                    </a-button>
                  </router-link>
                </a-menu-item>
              </a-menu>
            </template>
            <a-button type="primary">
              操作 ∨
            </a-button>
          </a-dropdown>
        </template>
      </a-table>
    </a-layout-content>
  </a-layout>
  <a-modal title="课程信息表单"
           v-model:visible="modalVisible"
           :confirm-loading="modalLoading"
           @ok="handleModalOk">
    <a-form ref="courseForm" :rules="courseRules" :model="course">
      <a-row>
        <a-col :span="12">
          <a-form-item label="封面">
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
        </a-col>
        <a-col :span="12">
          <a-form-item label="结课证书">
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
                @change="handleChangeCert"
            >
              <img v-if="certificateUrl" :src="certificateUrl" alt="avatar" style="height: 100px;width: 100px"/>
              <div v-else>
                <loading-outlined v-if="loadingUploadCert"></loading-outlined>
                <plus-outlined v-else></plus-outlined>
                <div class="ant-upload-text">上传</div>
              </div>
            </a-upload>
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :span="11">
          <a-form-item label="名称" name="name">
            <a-input v-model:value="course.name"/>
          </a-form-item>
        </a-col>
        <a-col :span="2"/>
        <a-col :span="11">
          <a-form-item label="讲师" name="teacher">
            <a-input v-model:value="course.teacher"/>
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :span="11">
          <a-form-item label="科目" name="subjectId">
            <a-select
                ref="select"
                v-model:value="course.subjectId"
            >
              <a-select-option v-for="c in subjects" :key="c.id" :value="c.id">
                {{ gradeMap.get(sgMap.get(c.id)) }}-{{ c.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="2"/>
        <a-col :span="11">
          <a-form-item label="排序" name="sort">
            <a-input v-model:value="course.sort" type="number"/>
          </a-form-item>
        </a-col>
      </a-row>
      <a-row>
        <a-col :span="11">
          <a-form-item label="价格" name="price">
            <a-input v-model:value="course.price" type="number"/>
          </a-form-item>
        </a-col>
        <a-col :span="2"/>
        <a-col :span="11">
          <a-form-item label="状态" name="status">
            <a-select v-model:value="course.status">
              <a-select-option
                  v-for="c in [{'id':true,'name':'已上架'},{'id':false,'name':'已下架'}]"
                  :key="c.id"
                  :value="c.id">
                {{ c.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item label="简介" name="description">
        <a-textarea v-model:value="course.description"/>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
import {createVNode, defineComponent, onMounted, ref} from 'vue';
import axios from "axios";
import {message, Modal} from 'ant-design-vue'
import {Tool} from "@/util/tool";
import {ExclamationCircleOutlined, LoadingOutlined, PlusOutlined} from "@ant-design/icons-vue";
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
  name: 'AdminCourse',
  components: {
    LoadingOutlined,
    PlusOutlined,
  },
  setup() {
    // 课程信息响应式对象
    const courses = ref();
    // 科目信息响应式对象
    const subjects = ref();
    // 科目ID-名称 键值对
    let subjectMap = new Map();
    // 年级ID-名称 键值对
    let gradeMap = new Map();
    // 科目ID-年级ID 键值对
    let sgMap = new Map();
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
        title: '封面',
        key: 'cover',
        slots: {customRender: 'cover'},
      },
      {
        title: '所属科目',
        dataIndex: 'subjectId',
        slots: {customRender: 'subject'},
      },
      {
        title: '名称',
        dataIndex: 'name',
      },
      {
        title: '讲师',
        dataIndex: 'teacher',
      },
      {
        title: '学员数',
        dataIndex: 'totalMember',
      },
      {
        title: '总课时',
        dataIndex: 'totalPeriod',
      },
      {
        title: '价格',
        dataIndex: 'price',
      },
      {
        title: '简介',
        dataIndex: 'description',
        ellipsis: true,
        width: 200,
      },
      {
        title: '状态',
        dataIndex: 'status',
        slots: {customRender: 'status'},
      },
      {
        title: '创建时间',
        dataIndex: 'createTime',
      },
      {
        title: '操作',
        key: 'action',
        slots: {customRender: 'action'},
      }
    ];

    const queryGrade = () => {
      axios.get("/api/admin/grade/list").then((response) => {
        const data = response.data;
        if (data.success) {
          const gradeData = data.content;
          for (let i = 0; i < gradeData.length; ++i) {
            gradeMap.set(gradeData[i].id, gradeData[i].name);
          }
        } else {
          message.error(data.message);
        }
      })
    }


    // 课程信息查询对象
    const searchCourse = ref();
    searchCourse.value = {}
    /**
     * 数据查询
     */
    const handleQuery = async (params: any) => {
      await axios.get("/api/admin/subject/list").then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          const subjectData = data.content;
          subjects.value = subjectData;
          for (let i = 0; i < subjectData.length; ++i) {
            subjectMap.set(subjectData[i].id, subjectData[i].name);
            sgMap.set(subjectData[i].id, subjectData[i].gradeId)
          }
        } else {
          message.error(data.message);
        }
      }).then(() => {

        loading.value = true;
        courses.value = [];
        axios.get("/api/admin/course/list", {
          params: {
            page: params.page,
            size: params.size,
          }
        }).then((response) => {
          loading.value = false;
          const data = response.data;
          if (data.success) {
            courses.value = data.content.list;
            // 重置分页按钮
            pagination.value.current = params.page;
            pagination.value.total = data.content.total;
          } else {
            message.error(data.message);
          }
        })
      })
    };

    /**
     * 查询课程信息
     */
    const handleQueryByCondition = (params: any) => {
      loading.value = true;
      courses.value = [];
      axios.get("/api/admin/course/search", {
        params: {
          page: params.page,
          size: params.size,
          teacher: searchCourse.value.teacher,
          name: searchCourse.value.name,
          status: searchCourse.value.status
        }
      }).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          courses.value = data.content.list;
          // 重置分页按钮
          pagination.value.current = params.page;
          pagination.value.total = data.content.total;
        } else {
          message.error(data.message);
        }

      })
    };
    /**
     * 表格信息改变时激活操作
     */
    const handleTableChange = (pagination: any) => {
      handleQuery({
        page: pagination.current,
        size: pagination.pageSize
      });
    };

    const courseForm = ref();
    const courseRules = {
      name: [
        {required: true, message: '名称不能为空', trigger: 'blur'},
        {whitespace: true, message: '名称不能为空', trigger: 'blur'}
      ],
      teacher: [
        {required: true, message: '教师名称不能为空', trigger: 'blur'},
        {whitespace: true, message: '教师名称不能为空', trigger: 'blur'}
      ],
      subjectId: [
        {required: true, type: 'any', message: '所属科目不能为空', trigger: 'blur'},
        {whitespace: true, type: 'any', message: '所属科目不能为空', trigger: 'blur'}
      ],
      sort: [
        {required: true, type: 'any', message: '排序权重不能为空', trigger: 'blur'},
        {whitespace: true, type: 'any', message: '排序权重不能为空', trigger: 'blur'}
      ],
      price: [
        {required: true, type: 'any', message: '价格不能为空', trigger: 'blur'},
        {whitespace: true, type: 'any', message: '价格不能为空', trigger: 'blur'}
      ],
      status: [
        {required: true, type: 'any', message: '状态信息不能为空', trigger: 'blur'},
        {whitespace: true, type: 'any', message: '状态信息不能为空', trigger: 'blur'}
      ],
      description: [
        {required: true, message: '简介不能为空', trigger: 'blur'},
        {whitespace: true, message: '简介不能为空', trigger: 'blur'}
      ],
    };

    // 表单
    const course = ref();
    const modalVisible = ref(false);
    const modalLoading = ref(false);
    const handleModalOk = () => {
      courseForm.value.validate().then(() => {
        course.value.cover = uploadImgUrl.value;
        course.value.certificate = uploadCertUrl.value;
        modalLoading.value = true;
        // 编辑保存课程信息
        axios.post("/api/admin/course/save", course.value).then((response) => {
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


    // 新增课程信息方法
    const add = () => {
      modalVisible.value = true;
      course.value = {};
      uploadImgUrl.value = "";
      uploadCertUrl.value = "";
      imageUrl.value = "";
      certificateUrl.value = "";
      courseForm.value.clearValidate();
    }

    // 删除课程信息方法
    const handleDelete = (id: number) => {
      Modal.confirm({
        title: '该操作无法撤销-确认要删除吗？',
        icon: createVNode(ExclamationCircleOutlined),
        okText: '确定',
        cancelText: '取消',
        onOk() {
          axios.delete("/api/admin/course/delete/" + id).then((response) => {
            const data = response.data;
            if (data.success) {
              handleQuery({
                page: pagination.value.current,
                size: pagination.value.pageSize
              })
              message.success("操作成功")
            }
          })
        }
      })
    }

    // 上传图片的方法
    const fileList = ref([]);
    const imageUrl = ref<string>('');
    const certificateUrl = ref<string>('');
    const loadingUpload = ref<boolean>(false);
    const loadingUploadCert = ref<boolean>(false);
    const actionUrl = ref();
    const headers = ref();
    const uploadImgUrl = ref();
    const uploadCertUrl = ref();
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
    const handleChangeCert = (info: FileInfo) => {
      if (info.file.status === 'uploading') {
        loadingUploadCert.value = true;
        return;
      }
      if (info.file.status === 'done') {
        getBase64(info.file.originFileObj, (base64Url: string) => {
          certificateUrl.value = base64Url;
          loadingUploadCert.value = false;
        });
        const res = JSON.parse(JSON.stringify(info.file.response));
        if (res.success) {
          message.success("图片上传成功");
          uploadCertUrl.value = res.content;
        } else {
          message.error(res.message)
        }

      }
      if (info.file.status === 'error') {
        loadingUploadCert.value = false;
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

    // 编辑课程信息方法
    const edit = (record: any) => {
      modalVisible.value = true;
      course.value = Tool.copy(record)
      imageUrl.value = course.value.cover;
      uploadImgUrl.value = course.value.cover;
      certificateUrl.value = course.value.certificate;
      uploadCertUrl.value = course.value.certificate;
      courseForm.value.clearValidate();
    }

    onMounted(() => {
      queryGrade();
      handleQuery({
        page: pagination.value.current,
        size: pagination.value.pageSize
      });
    });
    return {
      courses,
      course,
      loading,
      columns,
      pagination,
      modalVisible,
      modalLoading,
      searchCourse,
      subjectMap,
      gradeMap,
      subjects,
      sgMap,
      loadingUpload,
      loadingUploadCert,
      fileList,
      imageUrl,
      certificateUrl,
      actionUrl,
      headers,
      uploadImgUrl,
      uploadCertUrl,
      handleTableChange,
      edit,
      add,
      handleModalOk,
      handleDelete,
      handleQueryByCondition,
      handleChange,
      handleChangeCert,
      beforeUpload,
      courseForm,
      courseRules
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

