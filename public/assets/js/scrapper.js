$(document).ready(function() {
  $(".saved-buttons").on("click", function() {
    // the NEWS article id
    var thisId = $(this).attr("data-value");

    //attach news article _id to the save button in the modal for use in save post
    $("#saveButton").attr({ "data-value": thisId });

    //make an ajax call for the notes attached to this article
    $.get("/notes/" + thisId, function(data) {
      console.log(data);
      //empty modal title, textarea and notes
      $("#noteModalLabel").empty();
      $("#notesBody").empty();
      $("#notestext").val("");

      //delete button for individual note

      //add id of the current NEWS article to modal label
      $("#noteModalLabel").append(" " + thisId);
      //add notes to body of modal, will loop through if multiple notes
      for (var i = 0; i < data.notes.length; i++) {
        var button =
          " <a href=/deleteNote/" +
          data.notes[i]._id +
          '><button type="button" class="btn btn-danger">Delete</button></a>';
        $("#notesBody").append(
          "<li>" + data.notes[i].body + "  " + button + "</li>"
        );
      }
    });
  });
  $(".savenote").on("click", function() {
    // the NEWS article id
    console.log("save clicked");
    console.log($(this).attr("data-value"));
    var thisId = $(this).attr("data-value");
    //ajax POST
    $.ajax({
      method: "POST",
      url: "/notes/" + thisId,
      data: {
        //note created by the user
        body: $("#notestext")
          .val()
          .trim()
      }
    }).done(function(data) {
      //hide the modal when the submit button is clicked
      $("#noteModal").modal("hide");
    });
  });
});
