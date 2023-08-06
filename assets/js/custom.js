let data=[];
$(function(){
  // Export as EXCEL
  $("#csv").on("click",()=>{htmlTableToExcel("xlsx")})
  function htmlTableToExcel(type){
    var data = document.getElementById('tblToExcl');
    var excelFile = XLSX.utils.table_to_book(data, {sheet: "sheet1"});
    XLSX.write(excelFile, { bookType: type, bookSST: true, type: 'base64' });
    XLSX.writeFile(excelFile, 'geokit.' + type);
   }
  //  EXPORT AS PDF
  $("#pdf").on("click",()=>{pdf()})
  window.jsPDF = window.jspdf.jsPDF;
  var docPDF = new jsPDF();
  function pdf(){
  var elementHTML = document.querySelector("#tblToExcl");
  docPDF.html(elementHTML, {
  callback: function(docPDF) {
    docPDF.save('geokit.pdf');
  },
  x: 15,
  y: 15,
  width: 170,
  windowWidth: 650
  });
  }
    console.log("Heello")
    // Ensure the valued intered is a number
    document.querySelector("#init_wt").addEventListener("keypress", function (evt) {
      if (evt.which != 8 && evt.which != 0 && evt.which < 48 || evt.which > 57)
      {
          evt.preventDefault();
      }
  });
    
    $("#uploadform").on("submit", (e)=>{
        e.preventDefault();
        console.log($("#file"))
        $(".download_result").css("display", "none")
        const fd = new FormData();
        var file = $('#file')[0].files;
        // Check file selected or not
        if(file.length > 0 ){

            fd.append('file',file[0]);
            fd.append('owner',$("#owner").val());
            fd.append('init_wt',$("#init_wt").val());
            $(".modal-footer").html(`
            <div class="spinner-border text-info" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            `)
            $.ajax({
                 url:'http://127.0.0.1:8000/',
                 type:'post',
                 data:fd,
                 dataType: 'json',
                 contentType: false,
                 processData: false,
                 success:function(resp){
                     console.log(resp)
                     $(".download_result").css("display", "block")
                     $("#uploadform").get(0).reset()
                     $(".modal-footer").html(`
                            <button type="submit" class="btn btn-primary">Upload</button>

                        `)
                        $("#alert").css("display","block")
                        $(".analysis").css("display","block")
                        document.querySelector("#download_dataset").setAttribute("href",`${resp.detail.link}`)
                        resp.detail.df_passing.forEach((item, index)=>{
                            data.push(
                                { x: resp.detail.df_eive[index], y: `${item}`},
                            )
                        })
                        createChart();
                        // Populate the D10-CC values
                        $("#analysis__DD_CC").html(`
                        <td>${resp.detail.D10}</td>
                        <td>${resp.detail.D30}</td>
                        <td>${resp.detail.D60}</td>
                        <td>${resp.detail.CC}</td>
                        <td>${resp.detail.CU}</td>

                        `)
                        $("#analysis_soil").html(`
                        <td>${resp.detail.silt_clay_percentage}</td>
                        <td>${resp.detail.sand_percentage}</td>
                        <td>${resp.detail.gravel_percentage}</td>

                        `)
                 },
                error:function(err){
                    console.log(err)
                    $(".modal-footer").html(`
                            <button type="submit" class="btn btn-primary">Upload</button>

                        `)
                      $(".error-alert").html(`
                      <div class="alert alert-danger" id="alert" role="alert">
                        Error.
                      </div>
                      
                      `)
                    
                }
            });
       }else{
            alert("Please select a file.");
       }
    })
})

 // Sample data for particle size analysis
//  const data = [
//     { x: 11.75, y: 99.77 },
//     { x: 2, y: 90.045 },
//     { x: 0.85, y: 78.47 },
//     { x: 0.6, y: 58.36 },
//     { x: 0.425, y: 39.02 },
//     { x: 0.3, y: 23.13 },
//     { x: 0.15, y: 8.04 },
//     { x: 0.075, y: 3.0945 },
//     { x: 0.063, y: 2.13 },
//   ];

  // Prepare the data for Chart.js
  const chartData = {
    datasets: [{
      label: 'Particle Size',
      data: data,
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      pointRadius: 5,
      pointHoverRadius: 8,
      fill: true,
      showLine: true, // Show a connecting line
    }]
  };

  // Custom x-axis tick values
  const xAxisTicks = [
    { value: 0.001, label: '0.001' },
    { value: 0.01, label: '0.01' },
    { value: 0.1, label: '0.1' },
    { value: 1, label: '1' },
    { value: 10, label: '10' },
  ];

  // Custom logarithmic tick formatter for x-axis
  const logarithmicXTickFormatter = (value, index, values) => {
    const matchingTick = xAxisTicks.find(tick => tick.value === value);
    return matchingTick ? matchingTick.label : '';
  };

  // Custom logarithmic tick formatter for y-axis
  const logarithmicYTickFormatter = (value, index, values) => {
    const exponent = Math.floor(Math.log10(value));
    const base = Math.pow(10, exponent);
    const mantissa = value / base;
    if (mantissa === 1 || mantissa === 10) {
      return base.toString();
    } else {
      return (value.toFixed(mantissa < 1 ? 3 : 0));
    }
  };

  // Chart options for log-log plot
  const chartOptions = {
    scales: {
      x: {
        type: 'logarithmic',
        position: 'bottom',
        min: 0.001, // Set the minimum value for x-axis
        max: 10,    // Set the maximum value for x-axis
        ticks: {
          callback: logarithmicXTickFormatter,
        },
        title: {
          display: true,
          text: 'Particle Size (log scale)',
        }
      },
      y: {
        type: 'logarithmic',
        position: 'left',
        ticks: {
          callback: logarithmicYTickFormatter,
        },
        title: {
          display: true,
          text: 'Number Scale (log scale)',
        }
      }
    },
  };

function createChart(){
// Create the chart
  // if (myChart){
  //   myChart.destroy()
  // }
  const ctx = document.getElementById('myChart').getContext('2d');
  const myChart = new Chart(ctx, {
    type: 'line', // Use 'line' type to connect points with a line
    data: chartData,
    options: chartOptions
  });
}
