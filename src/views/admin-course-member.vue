<template>
  <a-layout>
    <a-breadcrumb style="background-color: white;margin-left: 5px">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>
        <router-link to="/admin/course">课程管理</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>学员管理</a-breadcrumb-item>
    </a-breadcrumb>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <a-form
          ref="queryFormRef"
          layout="inline"
          :model="searchCourseMember"
      >
        <a-form-item name="joinDate">
          <label>加入日期：</label><br/>
          <a-date-picker v-model:value="searchCourseMember.joinDate" placeholder="请选择加入日期"/>
        </a-form-item>
        <a-col :span="2"></a-col>
        <a-form-item style="text-align: center">
          <br/>
          <a-space size="middle">
            <a-button type="primary" @click="handleQueryByCondition({page:1, size: pagination.pageSize})">
              查询
            </a-button>
            <a-button type="default" @click="resetQueryForm">
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
      <br/>
      <a-table :columns="columns"
               :row-key="record => record.id"
               :data-source="courseMembers"
               :pagination="pagination"
               :loading="loading"
               @change="handleTableChange"
               bordered>
        <template #student="{record}">
          {{ studentMap.get(record.studentId).name }}
        </template>
        <template #phone="{record}">
          {{ studentMap.get(record.studentId).phone }}
        </template>
        <template v-slot:action="{record}">
          <a-button type="primary" @click="handleDelete(record.id)" danger>
            删除
          </a-button>
        </template>
      </a-table>
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
import {createVNode, defineComponent, onMounted, ref} from 'vue';
import axios from "axios";
import {message, Modal} from 'ant-design-vue'
import {Tool} from "@/util/tool";
import {useRoute} from "vue-router";
import moment from 'moment';
import 'moment/locale/zh-cn';
import {ExclamationCircleOutlined} from "@ant-design/icons-vue";

moment.locale('zh-cn');

export default defineComponent({
  name: 'AdminCourseMember',
  components: {},
  setup() {
    // 路由对象 用于获取queryId
    const route = useRoute();
    // 课程成员信息响应式对象
    const courseMembers = ref();
    // 学员ID-学员对象 键值对
    let studentMap = new Map();
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
        title: '学员名称',
        key: 'student',
        slots: {customRender: 'student'},
      },
      {
        title: '学员手机号',
        key: 'phone',
        slots: {customRender: 'phone'},
      },
      {
        title: '完成课程数',
        dataIndex: 'finishCourse',
      },
      {
        title: '加入时间',
        dataIndex: 'joinTime',
      },
      {
        title: '操作',
        key: 'action',
        slots: {customRender: 'action'},
      }
    ];

    // 课程成员信息查询对象
    const searchCourseMember = ref();
    searchCourseMember.value = {}
    /**
     * 数据查询
     */
    const handleQuery = async (params: any) => {
      loading.value = true;
      await axios.get("/api/admin/stu/list", {
        params: {
          page: 1,
          size: 100,
        }
      }).then((response) => {
        const data = response.data;
        if (data.success) {
          const stuData = data.content.list;
          for (let i = 0; i < stuData.length; ++i) {
            studentMap.set(stuData[i].id, stuData[i]);
          }
        } else {
          message.error(data.message);
        }
      }).then(() => {

        axios.get("/api/admin/course-member/search", {
          params: {
            courseId: route.query.courseId,
            page: params.page,
            size: params.size,
          }
        }).then((response) => {
          loading.value = false;
          const data = response.data;
          if (data.success) {
            courseMembers.value = data.content.list;
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
     * 查询课程成员信息
     */
    const handleQueryByCondition = async (params: any) => {
      loading.value = true;
      const join = searchCourseMember.value.joinDate ? moment(searchCourseMember.value.joinDate).format("YYYY-MM-DD") : null;
      await axios.get("/api/admin/course-member/search", {
        params: {
          page: params.page,
          size: params.size,
          courseId: route.query.courseId,
          joinDate: join,
        }
      }).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          courseMembers.value = data.content.list;
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
        courseId: route.query.courseId,
        size: pagination.pageSize
      });
    };

    // 删除课程成员信息方法
    const handleDelete = (id: number) => {
      Modal.confirm({
        title: '该操作无法撤销-确认要删除吗？',
        icon: createVNode(ExclamationCircleOutlined),
        okText: '确定',
        cancelText: '取消',
        onOk() {
          axios.delete("/api/admin/course-member/delete/" + id).then((response) => {
            const data = response.data;
            if (data.success) {
              handleQuery({
                courseId: route.query.courseId,
                page: pagination.value.current,
                size: pagination.value.pageSize
              })
              message.success("操作成功")
            }
          })
        }
      })
    }

    const queryFormRef = ref();
    // 重置查询表单
    const resetQueryForm = () => {
      queryFormRef.value.resetFields();
      handleQuery({page: 1, size: pagination.value.pageSize})
    }

    onMounted(() => {
      handleQuery({
        page: pagination.value.current,
        size: pagination.value.pageSize
      });
    });
    return {
      courseMembers,
      loading,
      columns,
      pagination,
      searchCourseMember,
      queryFormRef,
      studentMap,
      resetQueryForm,
      handleTableChange,
      handleDelete,
      handleQueryByCondition,
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

