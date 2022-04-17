<template>
  <a-layout>
    <a-breadcrumb style="background-color: white;margin-left: 5px">
      <a-breadcrumb-item><router-link to="/">首页</router-link></a-breadcrumb-item>
      <a-breadcrumb-item>考试管理</a-breadcrumb-item>
    </a-breadcrumb>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <a-table :columns="columns"
               :row-key="record => record.id"
               :data-source="exams"
               :loading="loading"
               @change="handleTableChange"
               bordered>
        <template #checkFlag="{record}">
          <a-tag color="cyan" :visible="record.checkFlag===true">已批改</a-tag>
          <a-tag color="purple" :visible="record.checkFlag===false">未批改</a-tag>
        </template>
        <template #status="{record}">
          <a-tag color="blue" :visible="record.status===false">未完成</a-tag>
          <a-tag color="green" :visible="record.status===true">已完成</a-tag>
        </template>
        <template v-slot:action="{record}">
          <a-dropdown>
            <template #overlay>
              <a-menu>
<!--                <a-menu-item key="editSort" :disabled="!record.status">-->
<!--                  <a-button type="link" size="small" @click="checkExam(record)"-->
<!--                            :disabled="!record.status || record.checkFlag">-->
<!--                    批改-->
<!--                  </a-button>-->
<!--                </a-menu-item>-->
                <a-menu-item key="preview">
                  <a-button type="link" size="small" @click="handlePreviewContent(record)">
                    预览
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
        <template v-for="question in questions" :key="question.id">
          <a-card style="width: 600px;border:1px solid #2d2e2e">
            <a-card>
              <h3>第 {{ question["sort"] }} 题</h3>
              <div :innerHTML='question["content"]'></div>
            </a-card>
            <a-card>
              <h3>答案：</h3>
              <div :innerHTML='question["answerText"]'></div>
              <div :innerHTML='question["answerOption"]'></div>
            </a-card>
            <a-card>
              <h3>学生答案：</h3>
              {{ answerMap.get(question["questionId"]) }}
            </a-card>
            <a-card v-show="checkVisible">
              <a-space size="small">
                得分：<a-input style="width: 50px"></a-input>
                <a-button type="primary" shape="circle"><CheckOutlined /></a-button>
              </a-space>
            </a-card>
          </a-card>
          <br/>
        </template>
      </a-drawer>
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
import {defineComponent, onMounted, ref} from 'vue';
import axios from "axios";
import {message} from 'ant-design-vue'
import {useRoute} from "vue-router";
import {CheckOutlined} from '@ant-design/icons-vue'

export default defineComponent({
  name: 'AdminExam',
  components: {
    CheckOutlined,
  },
  setup() {
    // 路由对象
    const route = useRoute();
    // 考试信息响应式对象
    const exams = ref();
    // 表示加载状态
    const loading = ref(false);
    // 页码信息
    const pagination = ref({
      current: 1,
      pageSize: 10,
      total: 0
    });
    // 表格列信息
    const columns = [
      {
        title: '试卷名称',
        dataIndex: 'paperName',
      },
      {
        title: '学员',
        dataIndex: 'studentName',
      },
      {
        title: '试卷总分',
        dataIndex: 'totalScore',
      },
      {
        title: '得分',
        dataIndex: 'score',
      },
      {
        title: '正确题数',
        dataIndex: 'rightCount',
      },
      {
        title: '错题数',
        dataIndex: 'errorCount',
      },
      {
        title: '批改状态',
        key: 'checkFlag',
        slots: {customRender: 'checkFlag'},
      },
      {
        title: '批改人',
        dataIndex: 'checkId',
      },
      {
        title: '状态',
        key: 'status',
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

    /**
     * 数据查询
     */
    const handleQuery = async () => {
      loading.value = true;
      axios.get("/api/admin/exam/list", {
        params: {
          page: pagination.value.current,
          size: pagination.value.pageSize
        }
      }).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          exams.value = data.content.list;
          pagination.value.total = data.content.list;
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


    // 查询试卷中的题目
    const questions = ref();
    let questionMap = new Map();
    const queryQuestion = async (paperId: any) => {
      await axios.get("/api/admin/exam-paper/query-questions", {params: {id: paperId}}).then((response) => {
        const data = response.data;
        if (data.success) {
          const questionList = data.content;
          questions.value = questionList;
          for (let i = 0; i < questionList.length; ++i) {
            questionMap.set(questionList[i]['questionId'], questionList[i]);
          }
        } else {
          message.error(data.message);
        }
      })
    };


    // 题目内容预览
    const drawerVisible = ref(false);
    const answerMap = ref(new Map());
    const handlePreviewContent = async (record: any) => {
      await queryQuestion(record.paperId);
      const answers = JSON.parse(record.studentAnswer);
      for (let k in answers) {
        if (Object.prototype.hasOwnProperty.call(answers, k)) {
          answerMap.value.set(k, answers[k]);
        }
      }
      drawerVisible.value = true;
    };

    // 关闭预览框
    const onDrawerClose = () => {
      drawerVisible.value = false;
    };

    // 批改试卷
    const checkScore = ref(0);
    const checkVisible = ref(false);
    const checkExam = (record:any) => {
      checkVisible.value = true;
      handlePreviewContent(record);
    }


    onMounted(() => {
      handleQuery();
    })

    return {
      exams,
      loading,
      columns,
      handleTableChange,
      drawerVisible,
      questions,
      answerMap,
      handlePreviewContent,
      onDrawerClose,
      checkExam,
      checkScore,
      checkVisible,
    }
  }
});

</script>
