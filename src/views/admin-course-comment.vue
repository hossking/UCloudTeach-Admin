<template>
  <a-layout>
    <a-breadcrumb style="background-color: white;margin-left: 5px">
      <a-breadcrumb-item><router-link to="/">首页</router-link></a-breadcrumb-item>
      <a-breadcrumb-item><router-link to="/admin/course">课程管理</router-link></a-breadcrumb-item>
      <a-breadcrumb-item>评论管理</a-breadcrumb-item>
    </a-breadcrumb>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <a-table :columns="columns"
               :row-key="record => record.id"
               :data-source="courseComments"
               :pagination="pagination"
               :loading="loading"
               @change="handleTableChange"
               bordered>
        <template #student="{record}">
          <label v-if="!record.studentId">管理员</label>
          <label v-else>{{ studentMap.get(record.studentId).name }}</label>
        </template>
        <template #reply="{record}">
          <label v-if="!record.replyId">主评论</label>
          <label v-else>回复ID: {{ record.replyId }}</label>
        </template>
        <template #flag="{record}">
          <a-tag color="blue" :visible="!!record.topFlag">置顶</a-tag>
          <a-tag color="red" :visible="!!record.eliteFlag">精华</a-tag>
        </template>
        <template v-slot:action="{record}">
          <a-dropdown>
            <template #overlay>
              <a-menu>
                <a-menu-item key="reply">
                  <a-button type="link" @click="reply(record)" size="small">
                    回复
                  </a-button>
                </a-menu-item>
                <a-menu-item key="top">
                  <a-button type="link" @click="handleTop(record)" size="small">
                    置顶
                  </a-button>
                </a-menu-item>
                <a-menu-item key="elite">
                  <a-button type="link" @click="handleElite(record)" size="small">
                    精华
                  </a-button>
                </a-menu-item>
                <a-menu-item key="delete">
                  <a-button type="link" size="small" @click="handleDeleteConfirm(record.id)" danger>
                    删除
                  </a-button>
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
  <a-modal title="回复表单"
           v-model:visible="modalVisible"
           :confirm-loading="modalLoading"
           @ok="handleModalOk">
    <a-form
        ref="replyForm"
        :rules="replyRules"
        :model="courseComment"
        :label-col="{ span : 6}">
      <a-form-item label="内容" name="content">
        <a-textarea v-model:value="courseComment.content"/>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
import {createVNode, defineComponent, onMounted, ref} from 'vue';
import {ExclamationCircleOutlined} from '@ant-design/icons-vue'
import axios from "axios";
import {message, Modal} from 'ant-design-vue'
import {useRoute} from "vue-router";
import {ValidateErrorEntity} from "ant-design-vue/es/form/interface";
import {Tool} from "@/util/tool";

export default defineComponent({
  name: 'AdminCourseComment',
  components: {},
  setup() {
    // 路由对象 用于获取queryId
    const route = useRoute();
    // 课程评论信息响应式对象
    const courseComments = ref();
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
        title: 'ID',
        dataIndex: 'id',
      },
      {
        title: '发表人',
        key: 'student',
        slots: {customRender: 'student'},
      },
      {
        title: '评论内容',
        dataIndex: 'content',
      },
      {
        title: '类型',
        key: 'replyId',
        slots: {customRender: 'reply'},
      },
      {
        title: '创建时间',
        dataIndex: 'createTime',
      },
      {
        title: '标志',
        key: 'flag',
        slots: {customRender: 'flag'},
      },
      {
        title: '操作',
        key: 'action',
        slots: {customRender: 'action'},
      }
    ];

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
          console.log(stuData)
          for (let i = 0; i < stuData.length; ++i) {
            studentMap.set(stuData[i].id, stuData[i]);
          }
        } else {
          message.error(data.message);
        }
      }).then(() => {
        axios.get("/api/admin/course-comment/search", {
          params: {
            courseId: route.query.courseId,
            page: params.page,
            size: params.size,
          }
        }).then((response) => {
          loading.value = false;
          const data = response.data;
          if (data.success) {
            courseComments.value = data.content.list;
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
     * 表格信息改变时激活操作
     */
    const handleTableChange = (pagination: any) => {
      handleQuery({
        page: pagination.current,
        size: pagination.pageSize
      });
    };

    const replyForm = ref();
    const replyRules = {
      content: [
        {required: true, message: '回复内容不能为空', trigger: 'blur'},
        {whitespace: true, message: '回复内容不能为空', trigger: 'blur'}
      ]
    };
    // 表单
    const courseComment = ref({
      'courseId': null,
      'content': null,
      'replyId': null
    });
    const modalVisible = ref(false);
    const modalLoading = ref(false);
    const handleModalOk = () => {
      replyForm.value.validate().then(() => {
        modalLoading.value = true;
        // 保存回复内容
        axios.post("/api/admin/course-comment/save", courseComment.value).then((response) => {
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

    // 编辑课程信息方法
    const reply = (record: any) => {
      courseComment.value.courseId = record.courseId;
      courseComment.value.replyId = record.id;
      if (replyForm.value) {
        replyForm.value.resetFields();
      }
      modalVisible.value = true;
    }


    const handleDeleteConfirm = (id: any) => {
      Modal.confirm({
        title: '该操作无法撤销-确认要删除吗？',
        icon: createVNode(ExclamationCircleOutlined),
        okText: '确定',
        cancelText: '取消',
        onOk() {
          axios.delete("/api/admin/course-comment/delete/" + id).then((response) => {
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

    const handleTop = (record: any) => {
      const obj = Tool.copy(record);
      obj.topFlag = !obj.topFlag;
      axios.post("/api/admin/course-comment/save", obj).then((response) => {
        const data = response.data;
        if (data.success) {
          handleQuery({
            page: pagination.value.current,
            size: pagination.value.pageSize
          })
          if (obj.topFlag) {
            message.success("置顶成功")
          } else {
            message.success("取消置顶成功")
          }
        } else {
          message.error(data.message)
        }
      })
    }
    const handleElite = (record: any) => {
      const obj = Tool.copy(record);
      obj.eliteFlag = !obj.eliteFlag;
      axios.post("/api/admin/course-comment/save", obj).then((response) => {
        const data = response.data;
        if (data.success) {
          handleQuery({
            page: pagination.value.current,
            size: pagination.value.pageSize
          })
          if (obj.eliteFlag) {
            message.success("精华设置成功")
          } else {
            message.success("取消精华成功")
          }
        } else {
          message.error(data.message)
        }
      })
    }

    onMounted(() => {
      handleQuery({
        page: pagination.value.current,
        size: pagination.value.pageSize
      });
    });
    return {
      courseComments,
      loading,
      columns,
      pagination,
      courseComment,
      modalVisible,
      modalLoading,
      replyForm,
      replyRules,
      studentMap,
      handleElite,
      handleTop,
      handleDeleteConfirm,
      handleModalOk,
      reply,
      handleTableChange,
    }
  }
});

</script>
