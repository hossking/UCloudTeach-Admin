export class Tool {
    /**
     * 空校验 null或""都返回true
     */
    public static isEmpty(obj: any) {
        if ((typeof obj === 'string')) {
            return !obj || obj.replace(/\s+/g, "") === ""
        } else {
            return (!obj || JSON.stringify(obj) === "{}" || obj.length === 0);
        }
    }

    /**
     * 非空校验
     */
    public static isNotEmpty(obj: any) {
        return !this.isEmpty(obj);
    }

    /**
     * 对象复制
     */
    public static copy(obj: Record<any, any>) {
        if (Tool.isNotEmpty(obj)) {
            return JSON.parse(JSON.stringify(obj));
        }
    }

    /**
     * 使用递归将数组转为树形结构
     */
    public static array2Tree(array: any, parentId: number) {
        if (Tool.isEmpty(array)) {
            return [];
        }

        const result = [];
        for (let i = 0; i < array.length; i++) {
            const c = array[i];
            if (Number(c.parent) === Number(parentId)) {
                result.push(c);
                // 递归查看当前节点对应的子节点
                const children = Tool.array2Tree(array, c.id);
                if (Tool.isNotEmpty(children)) {
                    c.children = children;
                }
            }
        }
        return result;
    }

    public static subject2Tree(array1: any, array2: any) {
        const result: any[] = [];
        const map = this.generateMap(array2, result);
        for (let i=0; i<array1.length; ++i) {
            const cur = array1[i];
            map.get(String(cur.gradeId)).children.push(array1[i]);
        }
        return result;
    }

    public static content2Tree(array1: any, array2: any) {
        const result: any[] = [];
        const map = this.generateMap(array2, result);
        for (let i=0; i<array1.length; ++i) {
            const cur = array1[i];
            map.get(String(cur.sectionId)).children.push(array1[i]);
        }
        return result;
    }

    public static generateMap(array2 : any, result : any[]) {
        const map = new Map();
        for (let i=0; i<Object.keys(array2).length; ++i) {
            map.set(String(array2[i].id),array2[i]);
            result.push(array2[i]);
            array2[i].children = [];
        }
        return map;
    }
}
