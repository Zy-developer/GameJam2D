/**
 * 随机
 */
 
export class Random {
    
    /**
     * 随机一个整数，取值区间[min, max]
     * @param min 最小值
     * @param max 最大值
     */
    static randomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /** 随机一个[0, 100]的值 */
    static randomInt0To100() {
        return Random.randomInt(0, 100);
    }

    /**
     * 随机一个整数，取值区间[min, max]
     * @param min 最小值
     * @param max 最大值
     */
     static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    /**
     * 随机一个bool值
     */
    static randomBool() {
        let result = 0;
        if (Random.randomNumber(1, 10) >= 5) {
            result = 1;
        }
        return !!result;
    }

    /**
     * 随机返回一个数组中的值
     * @param array 需要取值的数组
     */
    static arrayRandomValue(array) {
        let index = Random.randomNumber(0, array.length - 1);
        return array[index];
    }

    /**
     * 
     * @param arr 数组重组
     * @returns 
     */
    static shuffle(arr: Array<any>): Array<any> {
        for (var i = arr.length - 1; i >= 0; i--) {
            var randomIndex = Math.floor(Math.random() * (i + 1));
            var itemAtIndex = arr[randomIndex];
            arr[randomIndex] = arr[i];
            arr[i] = itemAtIndex;
        }

        return arr;
    }
}
(window as any).Random = Random;

// 设置随机种子
(Math as any).seed = Date.now();
(Math as any).random = () => {
    (Math as any).seed = ((Math as any).seed * 9301 + 49297) % 233280;
    return (Math as any).seed / 233280.0;
};
