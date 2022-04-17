<template>
  <a-breadcrumb v-if="visibleOfAdd" style="background-color: white;margin-left: 5px">
    <a-breadcrumb-item><router-link to="/">首页</router-link></a-breadcrumb-item>
    <a-breadcrumb-item><router-link to="/admin/paper">试卷管理</router-link></a-breadcrumb-item>
    <a-breadcrumb-item><router-link :to="'/admin/paper/question?id='+$route.query.paperId">试题管理</router-link></a-breadcrumb-item>
    <a-breadcrumb-item>挑选试题</a-breadcrumb-item>
  </a-breadcrumb>
  <a-breadcrumb v-if="!visibleOfAdd" style="background-color: white;margin-left: 5px">
    <a-breadcrumb-item><router-link to="/">首页</router-link></a-breadcrumb-item>
    <a-breadcrumb-item>题目管理</a-breadcrumb-item>
  </a-breadcrumb>
  <a-layout>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <a-form
          layout="horizontal"
          :model="searchQuestion"
      >
        <a-form-item>
          <a-row>
            <a-col :span="6">
              <label>科目：</label>
              <a-select
                  ref="select"
                  v-model:value="searchQuestion.subjectId"
                  placeholder="按科目名查询"
                  :allowClear=true
              >
                <a-select-option v-for="c in subjects" :key="c.id" :value="c.id">
                  {{ gradeMap.get(c.gradeId) }}-{{ c.name }}
                </a-select-option>
              </a-select>
            </a-col>
            <a-col :span="2"></a-col>
            <a-col :span="6">
              <label>课程：</label>
              <a-select
                  ref="select"
                  v-model:value="searchQuestion.courseId"
                  placeholder="按课程名查询"
                  :allowClear=true
              >
                <a-select-option v-for="c in courses" :key="c.id" :value="c.id">
                  {{ c.name }}
                </a-select-option>
              </a-select>
            </a-col>
            <a-col :span="2"></a-col>
            <a-col :span="6">
              <label>题型：</label>
              <a-select v-model:value="searchQuestion.type" placeholder="按题型查询" :allowClear=true>
                <a-select-option value=0>单选题</a-select-option>
                <a-select-option value=1>判断题</a-select-option>
                <a-select-option value=2>填空题</a-select-option>
                <a-select-option value=3>问答题</a-select-option>
                <a-select-option value=4>多选题</a-select-option>
              </a-select>
            </a-col>
          </a-row>
        </a-form-item>
        <a-form-item style="text-align: center">
          <a-space size="middle">
            <a-button type="primary" @click="handleQueryByCondition({page:1, size: pagination.pageSize})">
              查询
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
      <a-table :columns="columns"
               :row-key="record => record.id"
               :data-source="questions"
               :pagination="pagination"
               :loading="loading"
               @change="handleTableChange"
               bordered>
        <template #subject="{record}">
          {{ gradeMap.get(subjectMap.get(record.subjectId).gradeId) }}-{{ subjectMap.get(record.subjectId).name }}
        </template>
        <template #course="{record}">
          {{ courseMap.get(record.courseId) }}
        </template>
        <template #section="{record}">
          {{ sectionMap.get(record.sectionId) }}
        </template>
        <template #type="{record}">
          <a-tag color="blue" :visible="record.type===0">单选题</a-tag>
          <a-tag color="green" :visible="record.type===1">判断题</a-tag>
          <a-tag color="cyan" :visible="record.type===2">填空题</a-tag>
          <a-tag color="purple" :visible="record.type===3">问答题</a-tag>
          <a-tag color="orange" :visible="record.type===4">多选题</a-tag>
        </template>
        <template v-slot:action="{record}">
          <a-dropdown>
            <template #overlay>
              <a-menu>
                <a-menu-item key="preview">
                  <a-button type="link" size="small" @click="handlePreviewContent(record)">
                    预览
                  </a-button>
                </a-menu-item>
                <a-menu-item key="edit">
                  <router-link :to="'/admin/question/edit?id=' + record.id">
                    <a-button type="link" size="small">
                      编辑
                    </a-button>
                  </router-link>
                </a-menu-item>
                <a-menu-item key="delete">
                  <a-button type="link" size="small" @click="handleDeleteConfirm(record.id)" danger>
                    删除
                  </a-button>
                </a-menu-item>
              </a-menu>
            </template>
            <a-button type="primary" v-if="!visibleOfAdd">
              操作 ∨
            </a-button>
          </a-dropdown>
          <a-button type="primary" @click="addToPaper(record.id)" v-if="visibleOfAdd">
            添加至试卷
          </a-button>
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
  </a-layout>
</template>

<script lang="ts">
import {createVNode, defineComponent, onMounted, ref} from 'vue';
import {ExclamationCircleOutlined} from '@ant-design/icons-vue'
import axios from "axios";
import {message, Modal} from 'ant-design-vue'
import E from "wangeditor";
import {useRoute} from "vue-router";

export default defineComponent({
  name: 'AdminQuestion',
  components: {},
  setup() {
    // 路由对象
    const route = useRoute();
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
    // 章节ID-章节名 键值对
    let sectionMap = new Map();
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
        title: '章节',
        key: 'section',
        slots: {customRender: 'section'},
      },
      {
        title: '类型',
        key: 'type',
        slots: {customRender: 'type'},
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

    const querySection = async () => {
      if (sectionMap.size === 0) {
        await axios.get("/api/admin/course-section/list", {params: {page: 1, size: 100}}).then((response) => {
          const data = response.data;
          if (data.success) {
            const sectionData = data.content.list;
            for (let i = 0; i < sectionData.length; ++i) {
              sectionMap.set(sectionData[i].id, sectionData[i].title);
            }
          } else {
            message.error(data.message);
          }
        })
      }
    }

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
    const handleQuery = async (params: any) => {
      loading.value = true;
      await queryGrade()
      await querySubject();
      await queryCourse();
      await querySection();
      axios.get("/api/admin/question/search", {params: {page: params.page, size: params.size}}).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          questions.value = data.content.list;
          // 重置分页按钮
          pagination.value.current = params.page;
          pagination.value.total = data.content.total;
        } else {
          message.error(data.message);
        }
      })
    };

    // 题目信息查询对象
    const searchQuestion = ref();
    searchQuestion.value = {}
    /**
     * 查询题目
     */
    const handleQueryByCondition = (params: any) => {
      loading.value = true;
      axios.get("/api/admin/question/search", {
        params: {
          page: params.page,
          size: params.size,
          subjectId: searchQuestion.value.subjectId,
          courseId: searchQuestion.value.courseId,
          sectionId: searchQuestion.value.sectionId,
          type: searchQuestion.value.type
        }
      }).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          questions.value = data.content.list;
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


    const handleDeleteConfirm = (id: any) => {
      Modal.confirm({
        title: '该操作无法撤销-确认要删除吗？',
        icon: createVNode(ExclamationCircleOutlined),
        okText: '确定',
        cancelText: '取消',
        onOk() {
          axios.delete("/api/admin/question/delete/" + id).then((response) => {
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

    // 题目内容预览
    const drawerVisible = ref(false);
    const previewContent = ref();
    const previewAnswer = ref();
    const previewAnalysis = ref();
    const previewOptions = ref();
    const optionsVisible = ref(false);
    const handlePreviewContent = (record: any) => {
      previewContent.value = record.content;
      previewAnswer.value = record.answerText;
      previewAnalysis.value = record.analysis;
      if (record.type === 0 || record.type === 1 || record.type === 4) {
        previewOptions.value = record.options
        previewAnswer.value = record.answerOption
        optionsVisible.value = true;
      }
      drawerVisible.value = true;
    };
    const onDrawerClose = () => {
      drawerVisible.value = false;
      optionsVisible.value = false;
    };


    // 将题目加入到试卷中
    const visibleOfAdd = ref(false);
    const paperQuestion = ref();
    paperQuestion.value = {
      questionId: null,
      paperId: null
    }
    let QuestionMap = new Map();
    const queryExistQuestion = () => {
      axios.get("/api/admin/exam-paper/query-questions",{params:{id: route.query.paperId}}).then((response) => {
        const data = response.data;
        if (data.success) {
          const questionData = response.data.content;
          for (let i=0;i<questionData.length;++i) {
            QuestionMap.set(questionData[i].questionId, route.query.paperId);
          }
        } else {
          message.error("已选题目获取失败，"+data.message);
        }
      })
    }
    const addToPaper = (id: any) => {
      if (QuestionMap.has(id)) {
        message.error("题目已加入试卷中");
        return;
      }
      paperQuestion.value.questionId = id;
      paperQuestion.value.paperId = route.query.paperId;
      paperQuestion.value.score = 0;
      axios.post("/api/admin/exam-paper/save-question", paperQuestion.value).then((response) => {
        const data = response.data;
        if (data.success) {
          message.success("添加成功");
          QuestionMap.set(id, route.query.paperId)
        } else {
          message.error(data.message);
        }
      })
    }


    onMounted(() => {
      console.log(route.query.paperId)
      if (route.query.paperId) {
        visibleOfAdd.value = true;
        queryExistQuestion();
      }
      handleQuery({
        page: pagination.value.current,
        size: pagination.value.pageSize
      });
    });
    return {
      questions,
      loading,
      columns,
      pagination,
      subjects,
      subjectMap,
      courses,
      courseMap,
      gradeMap,
      grades,
      sectionMap,
      searchQuestion,
      handleQueryByCondition,
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
      visibleOfAdd,
      paperQuestion,
      addToPaper
    }
  }
});

</script>
