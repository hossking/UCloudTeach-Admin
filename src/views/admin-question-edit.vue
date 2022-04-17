<template>
  <a-layout>
    <a-breadcrumb style="background-color: white;margin-left: 5px">
      <a-breadcrumb-item>
        <router-link to="/">首页</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>题目编辑</a-breadcrumb-item>
    </a-breadcrumb>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <a-form
          ref="questionForm"
          :rules="rules"
          layout="vertical"
          :model="question"
      >
        <a-form-item label="科目" name="subjectId">
          <a-select
              v-model:value="question.subjectId"
              placeholder="请选择题目所属科目"
              @change="setSelectCourses"
          >
            <a-select-option v-for="c in subjects" :key="c.id" :value="c.id">
              {{ gradeMap.get(c.gradeId).name }}-{{ c.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="课程" name="courseId">
          <a-select
              v-model:value="question.courseId"
              placeholder="请选择题目所属课程"
              @change="setSelectSections"
          >
            <a-select-option v-for="c in selectCourses" :key="c.id" :value="c.id">
              {{ c.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="章节" name="sectionId">
          <a-select
              v-model:value="question.sectionId"
              placeholder="请选择题目所属章节"
          >
            <a-select-option v-for="c in selectSections" :key="c.id" :value="c.id">
              {{ c.title }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="题型" name="type">
          <a-select v-model:value="question.type" placeholder="请选择题型" @chage="handleTypeChange">
            <a-select-option
                v-for="c in [{'id':'0','name':'单选题'},{'id':'1','name':'判断题'},
                        {'id':'2','name':'填空题'},{'id':'3','name':'问答题'},{'id':'4','name':'多选题'},]"
                :key="c.id"
                :value="c.id">
              {{ c.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="题干">
          <div id="editor-content"></div>
        </a-form-item>
        <a-form-item label="答案" name="answerText" v-if="question.type==='2' || question.type==='3'">
          <a-textarea v-model:value="question.answerText"/>
        </a-form-item>
        <a-form-item label="题目选项" v-if="question.type==='0'||question.type==='4'">
          <a-row>
            <a-col :span="4">
              A:
              <a-input v-model:value="options.A"/>
            </a-col>
            <a-col :span="1"></a-col>
            <a-col :span="4">
              B:
              <a-input v-model:value="options.B"/>
            </a-col>
            <a-col :span="1"></a-col>
            <a-col :span="4">
              C:
              <a-input v-model:value="options.C"/>
            </a-col>
            <a-col :span="1"></a-col>
            <a-col :span="4">
              D:
              <a-input v-model:value="options.D"/>
            </a-col>
          </a-row>
        </a-form-item>
        <a-form-item label="答案选项" v-if="question.type==='4'">
          <a-checkbox-group v-model:value="answerOption">
            <a-checkbox value="A">A</a-checkbox>
            <a-checkbox value="B">B</a-checkbox>
            <a-checkbox value="C">C</a-checkbox>
            <a-checkbox value="D">D</a-checkbox>
          </a-checkbox-group>

        </a-form-item>
        <a-form-item label="答案选项" v-if="question.type==='0'">
          <a-radio-group v-model:value="answerOption[0]">
            <a-radio value="A">A</a-radio>
            <a-radio value="B">B</a-radio>
            <a-radio value="C">C</a-radio>
            <a-radio value="D">D</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="答案选项" v-if="question.type==='1'">
          <a-radio-group v-model:value="answerOption[0]">
            <a-radio value='A'>正确</a-radio>
            <a-radio value='B'>错误</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="解析">
          <div id="editor-analysis"></div>
        </a-form-item>
        <a-form-item style="text-align: center">
          <a-space size="middle">
            <a-button type="primary" @click="handleSave()">
              保存
            </a-button>
            <a-button type="default" @click="handleReset()">
              重置
            </a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
import {defineComponent, handleError, onMounted, ref} from 'vue';
import axios from "axios";
import {message} from 'ant-design-vue'
import {useRoute} from "vue-router";
import E from "wangeditor";
import {Tool} from "@/util/tool";
import {ValidateErrorEntity} from "ant-design-vue/es/form/interface";


export default defineComponent({
  name: 'AdminQuestionEdit',
  components: {},
  setup() {
    // wangeditor对象
    const editor1 = new E('#editor-content');
    const editor3 = new E('#editor-analysis');
    editor1.config.zIndex = 0;
    editor1.config.height = 120;
    editor3.config.zIndex = 0;
    editor3.config.height = 120;
    // 路由对象 用于获取queryId
    const route = useRoute();
    // 题目信息响应式对象
    const question = ref();
    question.value = {};
    // 年级ID-年级名 键值对
    let gradeMap = new Map();
    // 科目信息
    const subjects = ref();
    // 课程信息
    const courses = ref();
    // 章节信息
    const sections = ref();
    // 课程选项
    const selectCourses = ref<any>([]);
    // 章节选项
    const selectSections = ref<any>([]);

    const loading = ref(false);

    // 保存的题目对象
    const questionForm = ref();

    // 题目选项
    const options = ref({'A': null, 'B': null, 'C': null, 'D': null});
    // 题目正确选项
    const answerOption = ref();
    answerOption.value = [];

    const querySection = async () => {
      if (Tool.isEmpty(sections.value)) {
        await axios.get("/api/admin/course-section/list", {params: {page: 1, size: 100}}).then((response) => {
          const data = response.data;
          if (data.success) {
            sections.value = data.content.list;
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
            for (let i = 0; i < gradeData.length; ++i) {
              gradeMap.set(gradeData[i].id, gradeData[i]);
            }
          } else {
            message.error(data.message);
          }
        })
      }
    }

    const querySubject = async () => {
      if (Tool.isEmpty(subjects.value)) {
        await axios.get("/api/admin/subject/list").then((response) => {
          const data = response.data;
          if (data.success) {
            subjects.value = data.content;
          } else {
            message.error(data.message);
          }
        })
      }
    }

    const queryCourse = async () => {
      if (Tool.isEmpty(courses.value)) {
        await axios.get("/api/admin/course/list", {params: {page: 1, size: 100}}).then((response) => {
          const data = response.data;
          if (data.success) {
            courses.value = data.content.list;
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
      await querySection();
      if (route.query.id) {
        axios.get("/api/admin/question/search", {
          params: {
            id: route.query.id,
            page: 1,
            size: 1
          }
        }).then((response) => {
          loading.value = false;
          const data = response.data;
          if (data.success) {
            const record = data.content.list[0];
            question.value = Tool.copy(data.content.list[0]);
            setSelectCourses();
            question.value.courseId = record.courseId;
            setSelectSections();
            question.value.sectionId = record.sectionId;
            editor1.txt.html(record.content);
            editor3.txt.html(record.analysis);
            question.value.type = String(question.value.type);
            if (record.options) {
              options.value = JSON.parse(record.options);
            }
            if (record.answerOption) {
              answerOption.value = record.answerOption.split(',');
            }
          } else {
            message.error(data.message);
          }
        })
      }
    };

    const setSelectCourses = () => {
      selectCourses.value = []
      question.value.courseId = null;
      question.value.sectionId = null;
      for (let i = 0; i < Object.keys(courses.value).length; ++i) {
        if (courses.value[i].subjectId === question.value.subjectId) {
          selectCourses.value.push(courses.value[i]);
        }
      }
    }

    const setSelectSections = () => {
      selectSections.value = [];
      question.value.sectionId = null;
      for (let i = 0; i < Object.keys(sections.value).length; ++i) {
        if (sections.value[i].courseId === question.value.courseId) {
          selectSections.value.push(sections.value[i]);
        }
      }
    }

    const rules = {
      subjectId: [
        {required: true, message: '科目信息不能为空', trigger: 'blur'},
      ],
      courseId: [
        {required: true, message: '课程信息不能为空', trigger: 'blur'},
      ],
      sectionId: [
        {required: true, message: '章节信息不能为空', trigger: 'blur'},
      ],
      type: [
        {required: true, message: '题目类型不能为空', trigger: 'blur'},
      ]
    };

    // 对于富文本插件中内容的校验
    const validateContent = () => {
      // 题干校验
      if (editor1.txt.html() === "") {
        throw new Error("题干不能为空");
      }
      // 问答题填空题的答案校验
      if ((question.value.type === "2" || question.value.type === "3") && question.value.answerText === "") {
        throw new Error("答案不能为空");
      }
      // 选择题的选项 答案校验
      if (question.value.type === "0") {
        if (!(options.value.A && options.value.B && options.value.C && options.value.D)) {
          throw new Error("选项内容不能为空");
        }
        if (!answerOption.value) {
          throw new Error("答案选项不能为空");
        }
      }
      // 判断题的答案校验
      if (question.value.type === "1") {
        if (answerOption.value[0] === null) {
          throw new Error("答案选项不能为空");
        }
      }
      // 解析校验
      if (editor3.txt.html() === "") {
        throw new Error("解析不能为空");
      }
    }

    const handleSave = () => {
      // 题干内容与解析赋值
      question.value.content = editor1.txt.html();
      question.value.analysis = editor3.txt.html();
      // 对于不同类型进行题目选项/答案赋值
      if (question.value.type === '1') {
        question.value.options = {'A': '正确', 'B': '错误'};
        question.value.options = JSON.stringify(question.value.options);
        answerOption.value.sort();
        question.value.answerOption = answerOption.value.join(",");
      } else if (question.value.type === '0' || question.value.type === '4') {
        question.value.options = options.value;
        question.value.options = JSON.stringify(question.value.options);
        answerOption.value.sort();
        question.value.answerOption = answerOption.value.join(",");
      }
      try {
        validateContent();
        loading.value = true;
        questionForm.value.validate().then(() => {
          axios.post("/api/admin/question/save", question.value).then((response) => {
            loading.value = false;
            const data = response.data;
            if (data.success) {
              message.success("保存成功");
            } else {
              message.error(data.message);
            }
          })
        }).catch((error: ValidateErrorEntity) => {
          console.log('error', error);
        });
      } catch (error: any) {
        message.error(error.message);
      }
    }

    const handleReset = () => {
      editor1.txt.html("");
      editor3.txt.html("");
      options.value = {'A': null, 'B': null, 'C': null, 'D': null};
      answerOption.value = [];
      questionForm.value.resetFields();
    }

    const handleTypeChange = () => {
      options.value = {'A': null, 'B': null, 'C': null, 'D': null};
      answerOption.value = [];
    }

    onMounted(() => {
      handleQuery();
      editor1.create();
      editor3.create();
    });
    return {
      question,
      loading,
      subjects,
      gradeMap,
      selectCourses,
      selectSections,
      rules,
      questionForm,
      options,
      answerOption,
      handleTypeChange,
      handleSave,
      handleReset,
      setSelectCourses,
      setSelectSections,
    }
  }
});

</script>
