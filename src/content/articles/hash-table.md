---
title: Hash Table
description: 用雜湊函數把 key 換算成陣列索引，平均 O(1) 時間完成插入、查詢與刪除的鍵值對結構。
category: data-structures
keywords: [雜湊表, 哈希表, 散列表, hash map, hash function, 雜湊函數, unordered_map, unordered_set, 碰撞, collision, chaining, load factor]
difficulty: intermediate
related: [array, linked-list, binary-search-tree]
featured: false
publishedAt: 2026-11-05T22:50:00+08:00
---

## Overview

**Hash Table**（雜湊表）用來儲存**鍵值對**（key → value），例如「學號 → 姓名」、「單字 → 出現次數」。它的目標是：**不管存了多少資料，插入、查詢、刪除平均都只要 O(1)**。

做法是結合 Array 的 O(1) 隨機存取，加上一個**雜湊函數**（hash function）：

1. 用雜湊函數把 key 換算成一個整數。
2. 對陣列大小取餘數，得到一個索引。
3. 直接到陣列的那一格存取資料。

陣列的每一格稱為**桶子**（bucket）。不同的 key 可能被分到同一個桶子，這叫做**碰撞**（collision），必須額外處理。

C++ 的 `std::unordered_map`、`std::unordered_set`，Python 的 `dict`、`set`，底層都是雜湊表。

## Intuition

想像學校有 100 個**置物櫃**，規則是「用學號的最後兩碼當櫃子號碼」。

- 學號 `113502047` 的同學，直接去 47 號櫃。不需要從 0 號櫃一個一個找，這就是 O(1)。
- 「取最後兩碼」就是雜湊函數：把很長的學號，換算成 0–99 之間的櫃子號碼。
- 但學號 `113502147` 的同學也被分到 47 號櫃，這就是碰撞。解決方法之一是讓 47 號櫃裡放一個小籃子，兩個人的東西都放進去，找的時候在籃子裡翻一下。
- 如果全校有 5000 人卻只有 100 個櫃子，每個籃子都會塞滿，翻找就變慢了。所以人數變多時要**增加櫃子**。

## How It Works

### 雜湊函數

雜湊函數把 key 轉成整數，好的雜湊函數要滿足：

- **確定性**：同一個 key 每次算出來都一樣。
- **分布均勻**：不同的 key 盡量分散到不同的桶子。
- **計算快速**：否則就失去 O(1) 的意義。

字串常用**多項式雜湊**：

```text
h(s) = s[0]·31^(n-1) + s[1]·31^(n-2) + … + s[n-1]
index = h(s) mod m      （m 是桶子數）
```

每個字元和它的**位置**都會影響結果，所以 `"ab"` 和 `"ba"` 會得到不同的值。如果只把字元相加，兩者就會碰撞。

### 碰撞處理一：鏈結法（Separate Chaining）

每個桶子放一個 Linked List（或任何容器），落在同一個桶子的元素就串在一起：

```text
buckets
 [0] → alice
 [1] → bob → carol      ← bob 和 carol 碰撞，串在同一條鏈上
 [2]
 [3]
```

- **查詢**：算出桶子，在那條鏈上逐一比對 key。
- **插入**：先查詢；已存在就更新 value，不存在就加到鏈上。
- **刪除**：在鏈上找到後移除。

`std::unordered_map` 採用的就是鏈結法。

### 碰撞處理二：開放定址法（Open Addressing）

所有元素都直接存在陣列裡。發生碰撞時，依照固定規則找下一個空位，最簡單的是**線性探測**（linear probing）：試 `index + 1`、`index + 2`……直到找到空位。查詢時也用同樣的規則往後找。

開放定址法對 CPU 快取比較友善，但刪除比較麻煩（不能直接清空那一格，否則會截斷後面元素的探測路徑），而且陣列越滿效能下降越快。

### 負載因子與 Rehash

**負載因子**（load factor）α = 元素個數 n ÷ 桶子數 m，代表平均每個桶子有幾個元素。

- α 越大，每條鏈越長，查詢越慢。
- 所以 α 超過門檻時（`unordered_map` 預設是 1.0），就配置**更多桶子**（通常加倍），並把所有元素**重新計算位置**放進新的桶子，這叫做 **rehash**。

rehash 一次要 O(n)，但因為桶子數是倍數成長，和 `vector` 擴容一樣，平均到每次插入仍是**攤銷 O(1)**。

### 為什麼最壞情況是 O(n)

如果所有 key 都碰撞到同一個桶子（雜湊函數很差，或是有人故意構造這樣的輸入），整個雜湊表就退化成一條 Linked List，每次查詢都是 O(n)。平均 O(1) 的前提是**雜湊函數分布均勻**。

## Implementation

### 鏈結法 Hash Map

下面實作一個 `string → int` 的雜湊表，使用多項式雜湊，負載因子超過 1.0 時自動把桶子數加倍。

```cpp
#include <iostream>
#include <list>
#include <string>
#include <utility>
#include <vector>
using namespace std;

class HashMap {
public:
    explicit HashMap(size_t bucketCount = 4) : buckets(bucketCount), count(0) {}

    void put(const string& key, int value) {  // 插入；key 已存在就更新
        auto& bucket = buckets[indexOf(key)];
        for (auto& entry : bucket) {
            if (entry.first == key) {
                entry.second = value;
                return;
            }
        }
        bucket.emplace_back(key, value);
        ++count;
        if (loadFactor() > 1.0) rehash(buckets.size() * 2);  // 太擠了就擴充
    }

    bool get(const string& key, int& out) const {  // 找到回傳 true，值寫進 out
        for (const auto& entry : buckets[indexOf(key)]) {
            if (entry.first == key) {
                out = entry.second;
                return true;
            }
        }
        return false;
    }

    bool erase(const string& key) {
        auto& bucket = buckets[indexOf(key)];
        for (auto it = bucket.begin(); it != bucket.end(); ++it) {
            if (it->first == key) {
                bucket.erase(it);
                --count;
                return true;
            }
        }
        return false;
    }

    double loadFactor() const { return static_cast<double>(count) / buckets.size(); }
    size_t size() const { return count; }
    size_t bucketCount() const { return buckets.size(); }

    void debug() const {  // 印出每個桶子裡的 key
        for (size_t i = 0; i < buckets.size(); ++i) {
            cout << "  [" << i << "]";
            for (const auto& entry : buckets[i]) cout << " -> " << entry.first;
            cout << '\n';
        }
    }

private:
    vector<list<pair<string, int>>> buckets;
    size_t count;

    // 多項式雜湊：每個字元和它的位置都會影響結果。size_t 溢位會自動取模，是合法的
    static size_t hashOf(const string& key) {
        size_t h = 0;
        for (unsigned char c : key) h = h * 31 + c;
        return h;
    }

    size_t indexOf(const string& key) const { return hashOf(key) % buckets.size(); }

    void rehash(size_t newBucketCount) {
        vector<list<pair<string, int>>> old(newBucketCount);
        old.swap(buckets);  // buckets 換成新的空桶子，old 拿到舊資料
        for (auto& bucket : old) {
            for (auto& entry : bucket) {
                buckets[indexOf(entry.first)].push_back(move(entry));  // 桶子數變了，位置要重算
            }
        }
    }
};

int main() {
    HashMap ages;
    ages.put("alice", 20);
    ages.put("bob", 21);
    ages.put("carol", 19);
    cout << "size=" << ages.size() << " buckets=" << ages.bucketCount() << '\n';
    ages.debug();

    ages.put("dave", 22);
    ages.put("erin", 20);  // 5 個元素 / 4 個桶子 > 1.0 → 擴充成 8 個桶子
    cout << "size=" << ages.size() << " buckets=" << ages.bucketCount() << '\n';
    ages.debug();

    ages.put("bob", 30);  // 已存在：更新 value，元素數不變
    int v = 0;
    if (ages.get("bob", v)) cout << "bob = " << v << '\n';
    cout << boolalpha << "get(\"zoe\") -> " << ages.get("zoe", v) << '\n';

    ages.erase("alice");
    cout << "after erase: size=" << ages.size() << '\n';
}
```

```text
size=3 buckets=4
  [0] -> alice
  [1] -> bob -> carol
  [2]
  [3]
size=5 buckets=8
  [0] -> alice
  [1] -> carol
  [2] -> erin
  [3]
  [4] -> dave
  [5] -> bob
  [6]
  [7]
bob = 30
get("zoe") -> false
after erase: size=4
```

4 個桶子時，`bob` 和 `carol` 碰撞在 [1]；擴充成 8 個桶子後，每個 key 重新計算位置，碰撞就消失了。

### `std::unordered_map`：統計單字出現次數

```cpp
#include <algorithm>
#include <iostream>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;

int main() {
    string text = "to be or not to be that is the question to be";
    unordered_map<string, int> freq;

    istringstream in(text);
    string word;
    while (in >> word) ++freq[word];  // key 不存在時會自動建立，value 初始化為 0

    cout << "distinct words: " << freq.size() << '\n';
    cout << "count(\"be\") = " << freq.count("be") << ", freq[\"be\"] = " << freq["be"] << '\n';
    cout << "contains \"hamlet\"? " << (freq.find("hamlet") != freq.end() ? "yes" : "no") << '\n';

    // unordered_map 的走訪順序沒有保證，需要固定順序時先複製出來排序
    vector<pair<string, int>> items(freq.begin(), freq.end());
    sort(items.begin(), items.end(), [](const auto& a, const auto& b) {
        return a.second != b.second ? a.second > b.second : a.first < b.first;
    });
    for (const auto& [w, c] : items) cout << w << ' ' << c << '\n';
}
```

```text
distinct words: 8
count("be") = 1, freq["be"] = 3
contains "hamlet"? no
be 3
to 3
is 1
not 1
or 1
question 1
that 1
the 1
```

`count(key)` 在 `unordered_map` 中只會回傳 0 或 1，因為 key 不可重複；它代表「存不存在」，不是 value。

## Complexity

| 操作 | 平均 | 最壞 | 說明 |
|---|---|---|---|
| 插入 | O(1)（攤銷） | O(n) | 偶爾 rehash；所有 key 碰撞時退化 |
| 查詢 | O(1) | O(n) | |
| 刪除 | O(1) | O(n) | |
| 依序走訪所有元素 | O(n + m) | O(n + m) | m 為桶子數；順序沒有保證 |
| 找最小 key、範圍查詢 | O(n) | O(n) | 雜湊表不維持順序，這類需求改用 BST（`std::map`） |

**空間複雜度**：O(n + m)。為了維持低負載因子，桶子數通常和元素數同一個量級。

`std::unordered_map` 和 `std::map` 怎麼選：只需要用 key 查值時用 `unordered_map`（平均 O(1)）；需要依 key 排序、找前一個或下一個 key、範圍查詢時，用 `map`（O(log n)，底層是平衡 BST）。

## Common Mistakes

**1. 用 `operator[]` 檢查 key 是否存在**

```cpp
if (freq["hamlet"] > 0) { ... }   // 副作用：沒有 "hamlet" 時會插入 {"hamlet", 0}
```

`operator[]` 找不到 key 時會**自動插入**一筆預設值，`size()` 會因此變大。只想檢查是否存在時，用 `find()`、`count()`，或 C++20 的 `contains()`。

**2. 依賴 `unordered_map` 的走訪順序**

走訪順序取決於雜湊值與桶子數，不同編譯器、不同資料量、rehash 前後都可能不同。輸出需要固定順序時，複製到 `vector` 排序，或改用 `std::map`。

**3. rehash 之後還在用舊的 iterator**

插入元素可能觸發 rehash，此時**所有 iterator 都會失效**（指向元素的指標與參考則仍然有效）。不要在走訪 `unordered_map` 的迴圈中插入元素。

**4. 以為雜湊表「保證」O(1)**

O(1) 是**平均**情況，前提是雜湊函數分布均勻。在競賽中，有人會針對 `unordered_map` 預設的雜湊函數構造大量碰撞的測資，讓程式退化成 O(n²) 而超時。

**5. 自訂型別當 key 卻沒有提供雜湊函數**

`unordered_map<pair<int,int>, int>` 無法直接編譯，因為標準庫沒有提供 `pair` 的 `std::hash`。要自己寫雜湊函數物件，或把 pair 編碼成單一整數（例如 `x * 1000003LL + y`）。

**6. 雜湊函數設計不良**

例如字串雜湊只把字元相加，`"abc"`、`"bca"`、`"cab"` 全部碰撞。好的雜湊函數要讓 key 的每一部分（包括順序）都影響結果。
