---
title: Binary Search Tree
description: 每個節點的左子樹都比它小、右子樹都比它大的二元樹，讓搜尋、插入、刪除都只需走一條路徑。
category: data-structures
keywords: [二元搜尋樹, 二元樹, BST, binary tree, 中序走訪, inorder, std::set, std::map, 平衡樹, AVL, 紅黑樹]
difficulty: intermediate
related: [binary-search, linked-list, hash-table]
featured: true
publishedAt: 2026-11-05T22:31:00+08:00
---

## Overview

**Binary Search Tree**（BST，二元搜尋樹）是一種**二元樹**：每個節點最多有兩個子節點（左、右），並且滿足**BST 性質**：

> 對每個節點，**左子樹**中所有的值都比它**小**，**右子樹**中所有的值都比它**大**。

有了這個性質，搜尋時每到一個節點，只要比較一次就知道該往左還是往右，另一邊整個子樹都不用看，就像把 Binary Search 做成一個資料結構。

和 Binary Search 搭配排序陣列相比，BST 的優勢是**插入與刪除也很快**：排序陣列插入要搬移元素，是 O(n)；BST 只要找到位置、接上一個新節點。

但 BST 的效率取決於**樹的高度** h，所有操作都是 O(h)：

- 樹很「平衡」時，h ≈ log₂ n，操作是 O(log n)。
- 樹「歪掉」時（例如依序插入 1, 2, 3, …），h = n，退化成 Linked List，操作變成 O(n)。

C++ 的 `std::set`、`std::map` 底層是**紅黑樹**，一種會自動維持平衡的 BST，保證最壞情況也是 O(log n)。

## Intuition

想像一個**猜數字的決策樹**：每個節點是一個問題「是不是比 50 小？」，答案決定你往左還是往右走。每往下走一層，就排除了一大群不可能的答案。

也可以想像**圖書館找書**：先看書在哪一區（左邊是 0–499 號，右邊是 500–999 號），走到那區再看是哪一排、哪一層。每一個岔路都把搜尋範圍縮小，你不需要看過每一本書。

但如果圖書館的分類做得很差，每個岔路都是「左邊 1 本、右邊其他全部」，你就等於還是一本一本找。這就是 BST 退化的情況。

## How It Works

### 範例樹

依序插入 50, 30, 70, 20, 40, 60, 80，得到：

```text
        50
      /    \
    30      70
   /  \    /  \
  20  40  60  80
```

檢查 BST 性質：50 的左子樹 {20, 30, 40} 都比 50 小，右子樹 {60, 70, 80} 都比 50 大；30 的左邊 20 比它小、右邊 40 比它大……每個節點都成立。

### 搜尋

從根節點開始：

1. 目前節點是空的：找不到。
2. 目標等於目前節點：找到了。
3. 目標比較小：往**左**子樹找；比較大：往**右**子樹找。

找 60：50（60 > 50，往右）→ 70（60 < 70，往左）→ 60，找到。只走了 3 個節點。

### 插入

和搜尋走一樣的路徑，走到**空位**（`nullptr`）時，就在那裡放新節點。新節點一定是葉節點，不需要移動任何既有節點。

插入 45：50 → 30 → 40 → 40 的右邊是空的，放在那裡。

### 中序走訪：自動排好序

**中序走訪**（inorder traversal）的順序是「左子樹 → 自己 → 右子樹」。根據 BST 性質，左子樹全部比自己小、右子樹全部比自己大，所以中序走訪的輸出**一定是由小到大排序**：

```text
20 30 40 50 60 70 80
```

這也是檢查一棵樹是不是 BST 最可靠的方法。

### 刪除：三種情況

刪除是 BST 最複雜的操作。找到要刪的節點後，依它有幾個子節點分成三種情況：

1. **沒有子節點**（葉節點）：直接刪除，父節點指向它的指標改成 `nullptr`。
2. **只有一個子節點**：讓父節點直接接上這個唯一的子節點，再刪除自己。BST 性質不會被破壞，因為整個子樹原本就在正確的一側。
3. **有兩個子節點**：不能直接刪，否則兩棵子樹沒地方接。做法是找它的**中序後繼**（in-order successor），也就是**右子樹中最小的節點**：
   - 把後繼的值複製到這個節點。
   - 再到右子樹中刪除後繼。後繼是右子樹最左邊的節點，**不可能有左子節點**，所以刪它只會是情況 1 或 2。

為什麼用後繼取代可以維持 BST 性質？後繼比左子樹的所有值都大（它在右子樹裡），又比右子樹其他值都小（它是右子樹最小值），放在這個位置剛剛好。

### 高度與退化

若依序插入已排序的資料 1, 2, 3, 4, 5，每個新節點都比前面全部大，都接在最右邊：

```text
1
 \
  2
   \
    3
     \
      4
       \
        5
```

這棵樹的高度等於 n，和 Linked List 沒有兩樣，搜尋退化成 O(n)。

**平衡樹**（AVL 樹、紅黑樹）會在插入、刪除後透過**旋轉**（rotation）調整結構，保證高度維持在 O(log n)。實務上需要有序集合時，直接使用 `std::set` / `std::map` 即可。

## Implementation

```cpp
#include <algorithm>
#include <iostream>
using namespace std;

struct Node {
    int key;
    Node* left;
    Node* right;
    Node(int k) : key(k), left(nullptr), right(nullptr) {}
};

class BST {
public:
    BST() : root(nullptr) {}
    ~BST() { destroy(root); }
    BST(const BST&) = delete;  // 禁止複製，避免兩棵樹共用節點而重複 delete
    BST& operator=(const BST&) = delete;

    bool insert(int key) { return insert(root, key); }

    bool contains(int key) const {
        Node* cur = root;
        while (cur != nullptr) {
            if (key == cur->key) return true;
            cur = (key < cur->key) ? cur->left : cur->right;  // 每一步只往一邊走
        }
        return false;
    }

    bool erase(int key) { return erase(root, key); }
    void printInorder() const { inorder(root); cout << '\n'; }
    int height() const { return height(root); }

private:
    Node* root;

    // node 是「指標的參考」：這樣才能直接修改父節點裡指向這裡的那個指標
    static bool insert(Node*& node, int key) {
        if (node == nullptr) {
            node = new Node(key);
            return true;
        }
        if (key == node->key) return false;  // 不允許重複的值
        return key < node->key ? insert(node->left, key) : insert(node->right, key);
    }

    static bool erase(Node*& node, int key) {
        if (node == nullptr) return false;  // 找不到
        if (key < node->key) return erase(node->left, key);
        if (key > node->key) return erase(node->right, key);

        // 找到了：依子節點個數處理
        if (node->left == nullptr || node->right == nullptr) {  // 情況 1、2：0 或 1 個子節點
            Node* child = (node->left != nullptr) ? node->left : node->right;
            delete node;
            node = child;  // 父節點直接接上唯一的子節點（或 nullptr）
            return true;
        }
        Node* successor = node->right;  // 情況 3：找右子樹的最小值（中序後繼）
        while (successor->left != nullptr) successor = successor->left;
        node->key = successor->key;                 // 用後繼的值取代自己
        return erase(node->right, successor->key);  // 再從右子樹刪掉後繼
    }

    static void inorder(const Node* node) {  // 左 → 自己 → 右
        if (node == nullptr) return;
        inorder(node->left);
        cout << node->key << ' ';
        inorder(node->right);
    }

    static int height(const Node* node) {  // 這裡把空樹的高度定義為 0
        if (node == nullptr) return 0;
        return 1 + max(height(node->left), height(node->right));
    }

    static void destroy(Node* node) {  // 後序：先刪子樹，再刪自己
        if (node == nullptr) return;
        destroy(node->left);
        destroy(node->right);
        delete node;
    }
};

int main() {
    BST tree;
    for (int k : {50, 30, 70, 20, 40, 60, 80}) tree.insert(k);
    tree.printInorder();
    cout << "height = " << tree.height() << '\n';

    cout << boolalpha;
    cout << "contains 60? " << tree.contains(60) << ", contains 65? " << tree.contains(65) << '\n';
    cout << "insert 40 again? " << tree.insert(40) << '\n';

    tree.erase(20);  // 情況 1：葉節點
    tree.erase(30);  // 情況 2：只剩一個子節點（40）
    tree.erase(50);  // 情況 3：兩個子節點，由後繼 60 取代
    tree.printInorder();
    cout << "height = " << tree.height() << '\n';

    BST skewed;  // 依序插入已排序的資料
    for (int k = 1; k <= 7; ++k) skewed.insert(k);
    cout << "skewed height = " << skewed.height() << '\n';
}
```

```text
20 30 40 50 60 70 80
height = 3
contains 60? true, contains 65? false
insert 40 again? false
40 60 70 80
height = 3
skewed height = 7
```

三次刪除後的樹：

```text
    60
   /  \
  40   70
         \
          80
```

最後一行說明了退化：同樣是 7 個節點，平衡的樹高度是 3，依序插入的樹高度卻是 7。

## Complexity

| 操作 | 平均（隨機插入） | 最壞（退化） | 平衡樹（`std::set`） |
|---|---|---|---|
| 搜尋 | O(log n) | O(n) | O(log n) |
| 插入 | O(log n) | O(n) | O(log n) |
| 刪除 | O(log n) | O(n) | O(log n) |
| 最小值 / 最大值 | O(log n) | O(n) | O(log n) |
| 中序走訪 | O(n) | O(n) | O(n) |

所有操作的精確複雜度都是 **O(h)**，h 為樹高。

**空間複雜度**：O(n) 存放節點。遞迴實作的操作還會用到 O(h) 的呼叫堆疊，樹退化時 h = n，資料量大可能造成 stack overflow。

## Common Mistakes

**1. 驗證 BST 時只比較直接的子節點**

```text
    50
   /  \
  30   70
   \
    60
```

每個節點都比它的左子節點大、比右子節點小，但 60 在 50 的**左子樹**裡卻比 50 大，所以**不是** BST。BST 性質要求「整個子樹」都符合，正確做法是遞迴時傳入允許的上下界，或檢查中序走訪是否遞增。

**2. 插入已排序的資料，讓樹退化**

從檔案讀入已排序的資料再逐一插入，會得到一條鏈，所有操作變成 O(n)。需要保證效率時，使用平衡樹（`std::set`、`std::map`）。

**3. 遞迴插入時用傳值的指標**

```cpp
void insert(Node* node, int key) {   // 錯：node 是複本
    if (node == nullptr) { node = new Node(key); return; }  // 只改到複本，樹沒有變
    ...
}
```

修改的是區域變數，父節點的指標沒有被改到，新節點也就此洩漏。要用 `Node*&`（指標的參考），或讓函式回傳新的子樹根節點。

**4. 刪除有兩個子節點的節點時出錯**

常見錯誤：只複製了後繼的值，卻忘記從右子樹刪掉後繼，結果同一個值出現兩次；或是到整棵樹重新搜尋後繼的值，刪到了錯的節點。應該只在 `node->right` 這棵子樹內刪除。

**5. 忘記釋放節點**

每個 `new` 出來的節點都要 `delete`。解構時要用**後序**走訪，先刪子樹再刪自己；先刪自己就拿不到子節點的位址了。

**6. 搞混 BST 和 Heap**

兩者都是二元樹，但規則不同：BST 是「左 < 根 < 右」，適合搜尋任意值；Heap 是「父節點 ≥ 子節點」（max-heap），只保證根是最大值，適合實作優先佇列。
