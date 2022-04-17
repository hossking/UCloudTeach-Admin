<template>
  <a-layout-content style="margin: 0 16px;text-align:center;">
    <br/>
    <div v-if="snapshot" :style="{ padding: '24px', minHeight: '220px'}">
      <a-row :gutter="30">
        <a-col :span="2"/>
        <a-col :span="5">
          <a-card hoverable style="border-radius: 15px;">
            <a-row>
              <a-col :span="12">
                <div style="text-align: center;margin-top: 14px">
                  <UserOutlined :style="{fontSize:'30px',color:'#1890ff'}"/>
                </div>
              </a-col>
              <a-col :span="12">
                <div style="color:#afafaf;font-size: 14px;font-weight: bolder;">学员总数</div>
                <div style="font-size: 22px;">{{ snapshot.studentCount }}</div>
              </a-col>
            </a-row>
          </a-card>
        </a-col>
        <a-col :span="5">
          <a-card hoverable style="border-radius: 15px;">
            <a-row>
              <a-col :span="12">
                <div style="text-align: center;margin-top: 14px">
                  <CalculatorOutlined :style="{fontSize:'30px',color:'#a28cf2'}"/>
                </div>
              </a-col>
              <a-col :span="12">
                <div style="color:#afafaf;font-size: 14px;font-weight: bolder;">课程总数</div>
                <div style="font-size: 22px;">{{ snapshot.courseCount }}</div>
              </a-col>
            </a-row>
          </a-card>
        </a-col>
        <a-col :span="5">
          <a-card hoverable style="border-radius: 15px;">
            <a-row>
              <a-col :span="12">
                <div style="text-align: center;margin-top: 14px">
                  <ProfileOutlined :style="{fontSize:'30px',color:'#F4606C'}"/>
                </div>
              </a-col>
              <a-col :span="12">
                <div style="color:#afafaf;font-size: 14px;font-weight: bolder;">试卷总数</div>
                <div style="font-size: 22px;">{{ snapshot.paperCount }}</div>
              </a-col>
            </a-row>
          </a-card>
        </a-col>
        <a-col :span="5">
          <a-card hoverable style="border-radius: 15px;">
            <a-row>
              <a-col :span="12">
                <div style="text-align: center;margin-top: 14px">
                  <QuestionCircleOutlined :style="{fontSize:'30px',color:'#19CAAD'}"/>
                </div>
              </a-col>
              <a-col :span="12">
                <div style="color:#afafaf;font-size: 14px;font-weight: bolder;">题目总数</div>
                <div style="font-size: 22px;">{{ snapshot.questionCount }}</div>
              </a-col>
            </a-row>
          </a-card>
        </a-col>
      </a-row>
    </div>
    <a-row>
      <a-col :span="2"/>
      <a-col :span="20">
        <div id="main1" style="height:400px;"></div>
      </a-col>
      <a-col :span="2"/>
    </a-row>

  </a-layout-content>
</template>
<script lang="ts">
import {defineComponent, onMounted, ref} from 'vue';
import axios from "axios";
import {message} from "ant-design-vue";
import {UserOutlined, CalculatorOutlined, ProfileOutlined, QuestionCircleOutlined} from "@ant-design/icons-vue";

declare const echarts: any;
export default defineComponent({
  name: "Home",
  components: {
    UserOutlined,
    CalculatorOutlined,
    ProfileOutlined,
    QuestionCircleOutlined
  },
  setup() {
    // 每次进入首页都进行登录校验，以防过期仍可以访问首页的情况
    const checkLogin = () => {
      axios.get("/api/admin/check-login").then((response) => {
        const data = response.data;
        if (!data.success) {
          message.error(data.message);
        }
      })
    }

    const snapshot = ref();
    const getSnapshot = () => {
      axios.get("/api/admin/snapshot/get").then((response) => {
        const data = response.data;
        if (data.success) {
          snapshot.value = data.content;
        } else {
          message.error(data.message);
        }
      })
    }

    let xAxisData: any = [];
    let stuData: any = [];
    let courseData:any = [];
    let questionData:any = [];
    const getChartData = () => {
      axios.get("/api/admin/snapshot/before/get").then((response) => {
        const data = response.data;
        if (data.success) {
          const allData = data.content;
          for (let i = allData.length - 2; i >= 0; --i) {
            xAxisData.push(allData[i].createDate);
            stuData.push(allData[i].studentCount - allData[i + 1].studentCount);
            courseData.push(allData[i].courseCount - allData[i + 1].courseCount);
            questionData.push(allData[i].questionCount - allData[i + 1].questionCount);
          }
          initEcharts();
        } else {
          message.error(data.message);
        }
      })
    }

    const initEcharts = () => {
      // 基于准备好的dom，初始化echarts实例
      const myChart1 = echarts.init(document.getElementById('main1'));
      const option1 = {
        title: {
          text: '近十四天增长趋势'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['新增学员数','新增课程数','新增题目数']
        },
        grid: {
          left: '3%',
          right: '8%',
          bottom: '3%',
          containLabel: true
        },
        toolbox: {
          feature: {
            saveAsImage: {}
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: xAxisData
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '新增学员数',
            type: 'line',
            stack: 'Total',
            color: '#19CAAD',
            smooth: true,
            data: stuData,
          },
          {
            name: '新增课程数',
            type: 'line',
            stack: 'Total',
            color: '#96BFFF',
            smooth: true,
            data: courseData,
          },
          {
            name: '新增题目数',
            type: 'line',
            stack: 'Total',
            color: '#f49f42',
            smooth: true,
            data: questionData,
          },
        ]
      };
      myChart1.setOption(option1);
    }

    onMounted(() => {
      checkLogin();
      getSnapshot();
      getChartData();
    });

    return {
      snapshot,
    };
  },
});
</script>
<style>
.logo {
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.3);
}

.site-layout .site-layout-background {
  background: #fff;
}

[data-theme='dark'] .site-layout .site-layout-background {
  background: #141414;
}
</style>
