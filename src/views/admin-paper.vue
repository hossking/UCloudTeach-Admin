<template>
  <a-layout>
    <a-breadcrumb style="background-color: white;margin-left: 5px">
      <a-breadcrumb-item><router-link to="/">首页</router-link></a-breadcrumb-item>
      <a-breadcrumb-item>试卷管理</a-breadcrumb-item>
    </a-breadcrumb>
    <a-layout-content
        :style="{ background: '#fff', padding: '24px', margin: 0, minHeight: '280px' }"
    >
      <a-form
          layout="horizontal"
          :model="searchPaper"
      >
        <a-form-item>
          <a-row>
            <a-col :span="6">
              <a-input v-model:value="searchPaper.name" placeholder="按名称查询" :allowClear=true></a-input>
            </a-col>
            <a-col :span="1"></a-col>
            <a-col :span="6">
              <a-select v-model:value="searchPaper.status" placeholder="按状态查询" :allowClear=true>
                <a-select-option :value=false>未发布</a-select-option>
                <a-select-option :value=true>已发布</a-select-option>
              </a-select>
            </a-col>
            <a-col :span="1"></a-col>
            <a-col :span="6">
              <a-space size="middle">
                <a-button type="default" @click="handleQueryByCondition({page:1, size: pagination.pageSize})">
                  查询
                </a-button>
                <a-button type="primary" @click="add">
                  新增
                </a-button>
              </a-space>
            </a-col>
          </a-row>
        </a-form-item>
      </a-form>
      <a-table :columns="columns"
               :row-key="record => record.id"
               :data-source="papers"
               :pagination="pagination"
               :loading="loading"
               @change="handleTableChange"
               bordered>
        <template #course="{record}">
          {{ courseMap.get(record.courseId) }}
        </template>
        <template #status="{record}">
          <a-tag color="blue" :visible="record.status===false">未发布</a-tag>
          <a-tag color="green" :visible="record.status===true">已发布</a-tag>
        </template>
        <template #examTime="{record}">
          {{ record.examTime }}秒
        </template>
        <template #score="{record}">
          {{record.passScore}} / {{record.totalScore}}
        </template>
        <template #validateDate="{record}">
          {{ record.startDate }} ~ {{ record.endDate }}
        </template>
        <template v-slot:action="{record}">
          <a-dropdown>
            <template #overlay>
              <a-menu>
                <a-menu-item key="preview">
                  <router-link :to="'/admin/paper/question?id=' + record.id">
                    <a-button type="link" size="small">
                      题目管理
                    </a-button>
                  </router-link>
                </a-menu-item>
                <a-menu-item key="edit">
                  <a-button type="link" size="small" @click="edit(record)">
                    编辑
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
      <a-modal title="试卷信息表单"
               v-model:visible="modalVisible"
               :confirm-loading="modalLoading"
               @ok="handleModalOk"
               :destroyOnClose="true">
        <a-form
            ref="paperForm"
            :rules="paperRules"
            :model="paper"
            :label-col="{ span : 6}"
        >
          <a-form-item label="名称" name="name">
            <a-input v-model:value="paper.name"/>
          </a-form-item>
          <a-form-item label="所属科目" name="subjectId">
            <a-select
                v-model:value="paper.subjectId"
                placeholder="请选择试卷所属科目"
                @change="setSelectCourses"
            >
              <a-select-option v-for="c in subjects" :key="c.id" :value="c.id">
                {{ gradeMap.get(c.gradeId).name }}-{{ c.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="所属课程" name="courseId">
            <a-select
                v-model:value="paper.courseId"
                placeholder="请选择试卷所属课程"
            >
              <a-select-option v-for="c in selectCourses" :key="c.id" :value="c.id">
                {{ c.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="及格分数" name="passScore">
            <a-input v-model:value="paper.passScore" type="number"/>
          </a-form-item>
          <a-form-item label="总分" name="totalScore">
            <a-input v-model:value="paper.totalScore" type="number"/>
          </a-form-item>
          <a-form-item label="权重" name="sort">
            <a-input v-model:value="paper.sort" type="number"/>
          </a-form-item>
          <a-form-item label="考试时间(秒)" name="examTime">
            <a-input v-model:value="paper.examTime" type="number"/>
          </a-form-item>
          <a-form-item label="状态" name="status" v-if="!!paper.id">
            <a-select v-model:value="paper.status">
              <a-select-option :value=false>未发布</a-select-option>
              <a-select-option :value=true>已发布</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="机器批阅" name="autoCheck">
            <a-select v-model:value="paper.autoCheck">
              <a-select-option :value=false>否</a-select-option>
              <a-select-option :value=true>是</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="开始时间" name="startDate">
            <a-date-picker v-model:value="paper.startDate"/>
          </a-form-item>
          <a-form-item label="结束时间" name="endDate">
            <a-date-picker v-model:value="paper.endDate"/>
          </a-form-item>
          <a-form-item label="备注">
            <a-input v-model:value="paper.remark"/>
          </a-form-item>
        </a-form>
      </a-modal>
    </a-layout-content>
  </a-layout>
</template>

<script lang="ts">
import {createVNode, defineComponent, onMounted, ref} from 'vue';
import {ExclamationCircleOutlined} from '@ant-design/icons-vue'
import axios from "axios";
import {message, Modal} from 'ant-design-vue'
import moment from 'moment';
import 'moment/locale/zh-cn';
import {Tool} from "@/util/tool";
import {ValidateErrorEntity} from "ant-design-vue/es/form/interface";
import TheMenu from "@/components/TheMenu.vue";

moment.locale('zh-cn');

export default defineComponent({
  name: 'AdminPaper',
  components: {TheMenu},
  setup() {
    // 试卷信息响应式对象
    const papers = ref();
    // 课程ID-课程名 键值对
    let courseMap = new Map();
    // 课程信息
    const courses = ref();
    // 年级ID-年级名 键值对
    let gradeMap = new Map();
    // 科目信息
    const subjects = ref();
    // 课程选项
    const selectCourses = ref<any>([]);

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
        title: '名称',
        dataIndex: 'name',
      },
      {
        title: '课程',
        key: 'course',
        slots: {customRender: 'course'},
      },
      {
        title: '及格/总分',
        key: 'score',
        slots: {customRender: 'score'},
      },
      {
        title: '考试时长',
        key: 'examTime',
        slots: {customRender: 'examTime'},
      },
      {
        title: '参与人数',
        dataIndex: 'joinCount',
      },
      {
        title: '试题数',
        dataIndex: 'questionCount',
      },
      {
        title: '批阅数',
        dataIndex: 'checkCount',
      },
      {
        title: '状态',
        key: 'status',
        slots: {customRender: 'status'},
      },
      {
        title: '有效期',
        key: 'validateDate',
        slots: {customRender: 'validateDate'},
      },
      {
        title: '创建时间',
        dataIndex: 'createTime',
      },
      {
        title: '备注',
        dataIndex: 'remark',
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
      axios.get("/api/admin/exam-paper/search", {params: {page: params.page, size: params.size}}).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          papers.value = data.content.list;
          // 重置分页按钮
          pagination.value.current = params.page;
          pagination.value.total = data.content.total;
        } else {
          message.error(data.message);
        }
      })
    };

    // 试卷信息查询对象
    const searchPaper = ref();
    searchPaper.value = {}
    /**
     * 查询题目
     */
    const handleQueryByCondition = (params: any) => {
      loading.value = true;
      axios.get("/api/admin/exam-paper/search", {
        params: {
          page: params.page,
          size: params.size,
          name: searchPaper.value.name,
          status: searchPaper.value.status,
        }
      }).then((response) => {
        loading.value = false;
        const data = response.data;
        if (data.success) {
          papers.value = data.content.list;
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
          axios.delete("/api/admin/exam-paper/delete/" + id).then((response) => {
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

    // 试卷信息表单对象
    const paperForm = ref();
    const paperRules = {
      name: [
        {required: true, message: '名称不能为空', trigger: 'blur'},
      ],
      subjectId: [
        {required: true, message: '科目信息不能为空', trigger: 'blur'},
      ],
      courseId: [
        {required: true, message: '课程信息不能为空', trigger: 'blur'},
      ],
      passScore: [
        {required: true, message: '及格分数不能为空', trigger: 'blur', type: 'any'},
      ],
      examTime: [
        {required: true, message: '考试时长不能为空', trigger: 'blur', type: 'any'},
      ],
      sort: [
        {required: true, message: '排序权重不能为空', trigger: 'blur', type: 'any'},
      ],
      startDate: [
        {required: true, type: 'date', message: '开始日期不能为空', trigger: 'blur'},
      ],
      endDate: [
        {required: true, type: 'date', message: '结束日期不能为空', trigger: 'blur'},
      ],
      autoCheck: [
        {required: true, type: 'boolean', message: '机器批阅选项不能为空', trigger: 'blur'},
      ]
    };

    // 试卷信息对象
    const paper = ref();
    const modalVisible = ref(false);
    const modalLoading = ref(false);
    const handleModalOk = () => {
      paperForm.value.validate().then(() => {
        paper.value.startDate = moment(paper.value.startDate).format("YYYY-MM-DD");
        paper.value.endDate = moment(paper.value.endDate).format("YYYY-MM-DD");
        if (paper.value.startDate>paper.value.endDate) {
          message.error("开始日期不能大于结束日期")
          return;
        }
        modalLoading.value = true;
        // 编辑保存试卷信息
        axios.post("/api/admin/exam-paper/save", paper.value).then((response) => {
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
        message.error("请完善表单")
      });
    };

    // 新增课程信息方法
    const add = () => {
      modalVisible.value = true;
      paper.value = {};
      paper.value.status = false;
    }

    // 编辑试卷信息
    const edit = (record: any) => {
      modalVisible.value = true;
      paper.value = Tool.copy(record)
    }

    // 获取选中科目下的课程
    const setSelectCourses = () => {
      selectCourses.value = []
      paper.value.courseId = null;
      for (let i = 0; i < Object.keys(courses.value).length; ++i) {
        if (courses.value[i].subjectId === paper.value.subjectId) {
          selectCourses.value.push(courses.value[i]);
        }
      }
    }

    onMounted(() => {
      handleQuery({
        page: pagination.value.current,
        size: pagination.value.pageSize
      });
    });
    return {
      papers,
      loading,
      columns,
      pagination,
      courses,
      courseMap,
      subjects,
      gradeMap,
      selectCourses,
      searchPaper,
      paper,
      modalVisible,
      modalLoading,
      paperForm,
      paperRules,
      add,
      edit,
      handleModalOk,
      handleQueryByCondition,
      handleDeleteConfirm,
      handleTableChange,
      setSelectCourses,
    }
  }
});

</script>
