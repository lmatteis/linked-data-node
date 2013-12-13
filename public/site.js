$(function() {
    var $document = $(document.body);
    $.get('/header.html', function(data) {
        var html = $document.html();
        $document.html( data + html );
    });
    $.get('/footer.html', function(data) {
        var html = $document.html();
        $document.html( html + data );
    });
});
