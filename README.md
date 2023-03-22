# aaaaaaa
Copy lưu lại từ https://voz.vn/t/tong-hop-nhung-addon-chat-cho-firefox-pc-mobile.682181/post-24087965 và https://voz.vn/t/tong-hop-nhung-addon-chat-cho-firefox-pc-mobile.682181/post-24088744.

Userscript để convert VietPhrase ngay trên trình duyệt thông qua Tampermonkey, Greasemonkey, Firemonkey... và một số con khỉ khác có cùng chức năng.

Vietphrase Translate.user.js là file userscript, trong đó phần header có 2 dòng trỏ tới các file PhienAm, Names và VietPhrase có dạng
@require  https://đuongdantoifileDictionary

Các file PhienAm, Names, Vietphrase là các file có dạng

const Names = {
"TentiengTau1":"TentiengAnh1",
"TentiengTau2":"TentiengAnh2",
"TentiengTau3":"TentiengAnh3"};

Do định dạng nó khác file từ điển hay dùng của Quick Translation nên có script convertDict 
