// Cara menambah kategori baru:
// 1. Tambahkan key baru (misal: 'zakat') di dalam objek categories.
// 2. Isi title (judul yang muncul di home dan breadcrumb).
// 3. topics adalah array of objects, masing-masing punya:
//    - id: unik dalam kategori
//    - title: judul topik
//    - content: teks penjelasan dengan format khusus:
//        * ((teks tombol)) → akan menjadi tombol yang memunculkan modal kitab
//        * **teks** → teks akan diberi latar kuning tipis
//        * !!teks catatan!! → teks catatan (akan jadi miring dengan border kiri)
//    - tags: array of objects untuk setiap tombol yang ada di content. Setiap objek punya:
//        * tag: teks tombol (harus sama persis dengan yang ada di content, tanpa kurung)
//        * header: judul yang muncul di modal kitab (misal: "Minhajut Thalibin, Hlm 54 Jld 2")
//        * kitab: isi teks arab dengan gaya teks arab amiri dan ketik dengan keyboard arab

(function() {
  var scripts = document.getElementsByTagName('script');
  var currentScript = scripts[scripts.length - 1];
  var baseUrl = currentScript.src.substring(0, currentScript.src.lastIndexOf('/') + 1);
  var xhr = new XMLHttpRequest();
  xhr.open('GET', baseUrl + 'data.json', false);
  xhr.send();
  if (xhr.status === 200) {
    try {
      var rawData = JSON.parse(xhr.responseText);
      delete rawData._comment;
      window.categories = rawData;
    } catch (e) {
      console.error('Parse error', e);
      window.categories = {};
    }
  } else {
    console.error('Failed load data.json from ' + baseUrl + 'data.json', xhr.status);
    window.categories = {};
  }
})();
