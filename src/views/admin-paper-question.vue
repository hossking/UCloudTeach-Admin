<template>
  <a-layout>
    <a-breadcrumb style="background-color: white;margin-left: 5px">
      <a-breadcrumb-item><router-link to="/">首页</router-link></a-breadcrumb-item>
      <a-breadcrumb-item><router-link to="/admin/paper">试卷管理</router-link></a-breadcrumb-item>
      <a-breadcrumb-item>试题管理</a-breadcrumb-item>
    </a-breadcrumb>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <router-link :to="'/admin/question?paperId='+ toAddUrl">
        <a-button type="primary">
          挑选题目
        </a-button>
      </router-link>
      <a-table :columns="columns"
               :row-key="record => record.id"
               :data-source="questions"
               :loading="loading"
               @change="handleTableChange"
               bordered>
        <template #subject="{record}">
          {{ gradeMap.get(subjectMap.get(record.subjectId).gradeId) }}-{{ subjectMap.get(record.subjectId).name }}
        </template>
        <template #course="{record}">
          {{ courseMap.get(record.courseId) }}
        </template>
        <template #type="{record}">
          <a-tag color="blue" :visible="record.type===0">选择题</a-tag>
          <a-tag color="green" :visible="record.type===1">判断题</a-tag>
          <a-tag color="cyan" :visible="record.type===2">填空题</a-tag>
          <a-tag color="purple" :visible="record.type===3">问答题</a-tag>
          <a-tag color="orange" :visible="record.type===4">多选题</a-tag>
        </template>
        <template v-slot:action="{record}">
          <a-dropdown>
            <template #overlay>
              <a-menu>
                <a-menu-item key="editSort">
                  <a-button type="link" size="small" @click="edit(record)">
                    编辑
                  </a-button>
                </a-menu-item>
                <a-menu-item key="preview">
                  <a-button type="link" size="small" @click="handlePreviewContent(record)">
                    预览
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
      <a-drawer width="1000" placement="right" :closable="false" :visible="drawerVisible" @close="onDrawerClose">
        <a-card title="题干内容:" style="width: 600px;border:1px solid #2d2e2e">
          <div :innerHTML="previewContent"></div>
        </a-card>
        <br/><br/>
        <a-card title="题目选项:" style="width: 600px;border:1px solid #2d2e2e" v-show="optionsVisible">
          <div :innerHTML="previewOptions"></div>
        </a-card>
        <br/><br/>
        <a-card title="题目答案:" style="width: 600px;border:1px solid #2d2e2e">
          <div :innerHTML="previewAnswer"></div>
        </a-card>
        <br/><br/>
        <a-card title="题目解析:" style="width: 600px;border:1px solid #2d2e2e">
          <div :innerHTML="previewAnalysis"></div>
        </a-card>
      </a-drawer>
    </a-layout-content>
    <a-modal title="题目信息表单"
             v-model:visible="modalVisible"
             :confirm-loading="modalLoading"
             @ok="handleModalOk"
             :destroyOnClose="true">
      <a-form
          ref="editRef"
          :rules="sortRules"
          :model="editRecord"
          :label-col="{ span : 6}"
      >
        <a-form-item label="题号" name="sort">
          <a-input v-model:value="editRecord.sort" type="number"/>
        </a-form-item>
        <a-form-item label="分值" name="score">
          <a-input v-model:value="editRecord.score" type="number"/>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-layout>
</template>

<script lang="ts">
import {createVNode, defineComponent, onMounted, ref} from 'vue';
import {ExclamationCircleOutlined} from '@ant-design/icons-vue'
import axios from "axios";
import {message, Modal} from 'ant-design-vue'
import E from "wangeditor";
import {useRoute} from "vue-router";
import {Tool} from "@/util/tool";
import {ValidateErrorEntity} from "ant-design-vue/es/form/interface";

export default defineComponent({
  name: 'AdminPaperQuestion',
  components: {},
  setup() {
    // 路由对象
    const route = useRoute();
    // 跳转路径
    const toAddUrl = ref();
    // 题目信息响应式对象
    const questions = ref();
    // 年级ID-年级名 键值对
    let gradeMap = new Map();
    // 年级信息
    const grades = ref();
    // 科目ID-科目对象 键值对
    let subjectMap = new Map();
    // 科目信息
    const subjects = ref();
    // 课程ID-课程名 键值对
    let courseMap = new Map();
    // 课程信息
    const courses = ref();
    // 表示加载状态
    const loading = ref(false);
    // 表格列信息
    const columns = [
      {
        title: '题号',
        dataIndex: 'sort',
      },
      {
        title: '科目',
        key: 'subject',
        slots: {customRender: 'subject'},
      },
      {
        title: '课程',
        key: 'course',
        slots: {customRender: 'course'},
      },
      {
        title: '分值',
        dataIndex: 'score',
      },
      {
        title: '类型',
        key: 'type',
        slots: {customRender: 'type'},
      },
      {
        title: '创建时间',
        dataIndex: 'addTime',
      },
      {
        title: '操作',
        key: 'action',
        slots: {customRender: 'action'},
      }
    ];

    const queryGrade = async () => {
      if (gradeMap.size === 0) {
        await axios.get("/api/admin/grade/list").then((response) => {
          const data = response.data;
          if (data.success) {
            const gradeData = data.content;
            grades.value = gradeData;
            for (let i = 0; i < gradeData.length; ++i) {
              gradeMap.set(gradeData[i].id, gradeData[i].name);
            }
          } else {
            message.error(data.message);
          }
        })
      }
    }

    const querySubject = async () => {
      if (subjectMap.size === 0) {
        await axios.get("/api/admin/subject/list").then((response) => {
          const data = response.data;
          if (data.success) {
            const subjectData = data.content;
            subjects.value = subjectData;
            for (let i = 0; i < subjectData.length; ++i) {
              subjectMap.set(subjectData[i].id, subjectData[i]);
            }
          } else {
            message.error(data.message);
          }
        })
      }
    }

    const queryCourse = async () => {
      if (courseMap.size === 0) {
        await axios.get("/api/admin/course/list", {params: {page: 1, size: 100}}).then((response) => {
          const data = response.data;
          if (data.success) {
            const courseData = data.content.list;
            courses.value = courseData;
            for (let i = 0; i < courseData.length; ++i) {
              courseMap.set(courseData[i].id, courseData[i].name);
            }
          } else {
            message.error(data.message);
          }
        })
      }
    }

    /**
     * 数据查询
     */
    const handleQuery = async () => {
      loading.value = true;
      await queryGrade()
      await querySubject();
      await queryCourse();
      axios.get("/api/admin/exam-paper/query-questions", {
        params: {
          id: route.query.id
        }
      }).then((response) => {
        loading.value = false;
        const data = response.data;
        console.log(data);
        if (data.success) {
          questions.value = data.content;
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


    const handleDeleteConfirm = (id: any) => {
      Modal.confirm({
        title: '该操作无法撤销-确认要删除吗？',
        icon: createVNode(ExclamationCircleOutlined),
        okText: '确定',
        cancelText: '取消',
        onOk() {
          axios.delete("/api/admin/exam-paper/delete-question/" + id).then((response) => {
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

    // 题目内容预览
    const drawerVisible = ref(false);
    const previewContent = ref();
    const previewAnswer = ref();
    const previewAnalysis = ref();
    const previewOptions = ref();
    const optionsVisible = ref(false);
    const handlePreviewContent = (record: any) => {
      previewContent.value = record.content
      previewAnswer.value = record.answerText
      previewAnalysis.value = record.analysis
      if (record.type === 0 || record.type === 1 || record.type === 4) {
        previewOptions.value = record.options
        previewAnswer.value = record.answerOption;
        optionsVisible.value = true;
      }
      drawerVisible.value = true;
    };
    const onDrawerClose = () => {
      drawerVisible.value = false;
      optionsVisible.value = false;
    };

    // 修改题号
    const modalVisible = ref(false);
    const modalLoading = ref(false);
    const sortRules = {
      sort: [
        {required: true, type: 'any', message: '题号不能为空', trigger: 'blur'},
      ],
      score: [
        {required: true, type: 'any', message: '分值不能为空', trigger: 'blur'},
      ],
    };
    const editRef = ref();
    const editRecord = ref();
    editRecord.value = {};
    const handleModalOk = () => {
      modalLoading.value = true;
      editRef.value.validate().then(() => {
        axios.post("/api/admin/exam-paper/save-question", editRecord.value).then((response) => {
          const data = response.data;
          if (data.success) {
            message.success("修改成功");
            modalVisible.value = false;
            handleQuery();
          } else {
            message.error(data.message);
          }
          modalLoading.value = false
        })
      }).catch((error: ValidateErrorEntity) => {
        modalLoading.value = false;
        message.error("请完善表单")
      });

    };
    const edit = (record: any) => {
      modalVisible.value = true;
      editRecord.value = Tool.copy(record)
      editRecord.value.paperId = route.query.id;
    }

    onMounted(() => {
      toAddUrl.value = route.query.id;
      handleQuery();
    });
    return {
      questions,
      loading,
      columns,
      subjects,
      subjectMap,
      courses,
      courseMap,
      gradeMap,
      grades,
      handleDeleteConfirm,
      handleTableChange,
      drawerVisible,
      previewContent,
      previewAnswer,
      previewAnalysis,
      previewOptions,
      optionsVisible,
      handlePreviewContent,
      onDrawerClose,
      modalVisible,
      modalLoading,
      handleModalOk,
      sortRules,
      editRef,
      editRecord,
      edit,
      toAddUrl,
    }
  }
});

</script>
