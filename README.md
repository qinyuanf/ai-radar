# ai-radar

每日 AI Agent 情报存档 + 页面。三个 feed 日更：

- **技术日报** `data/report/`
- **Github 增长榜** `data/growth/`
- **Github 热门榜** `data/hot/`

每个 feed 一天一文件 `YYYY-MM-DD.json`，`data/manifest.json` 记可用日期。页面 `index.html` 纯静态，GitHub Pages 直出。

云端 routine 每天跑前 clone 读近 7 天去重，跑后写当天文件 + 更新 manifest + push，并推钉钉。
