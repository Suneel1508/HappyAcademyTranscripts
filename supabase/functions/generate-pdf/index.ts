import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

interface PDFRequest {
  transcriptId: string
  studentInfo: any
  transcriptInfo: any
  courses: any[]
  gpaData: any
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse request body
    const { transcriptId, studentInfo, courses, gpaData }: PDFRequest = await req.json()

    console.log('Generating PDF for transcript:', transcriptId)

    // Validate input
    if (!transcriptId || !studentInfo || !courses) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required data' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate HTML content for PDF
    const htmlContent = generateTranscriptHTML(studentInfo, transcriptInfo, courses, gpaData)

    // For now, return the HTML content as a simple PDF-like response
    // In a production environment, you would use a PDF generation library
    const pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Official Transcript - ${studentInfo.last_name}, ${studentInfo.first_name}</title>
    <style>
        body { 
            font-family: 'Times New Roman', serif; 
            margin: 0; 
            padding: 20px; 
            background: white;
            position: relative;
        }
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72px;
            color: rgba(200, 200, 200, 0.3);
            font-weight: bold;
            z-index: -1;
            pointer-events: none;
        }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 18px; font-weight: bold; letter-spacing: 2px; margin-bottom: 10px; }
        .contact { font-size: 12px; line-height: 1.4; }
        .section-title { font-size: 14px; font-weight: bold; text-align: center; margin: 20px 0 15px; letter-spacing: 1px; }
        .student-info { margin-bottom: 30px; }
        .student-table { width: 100%; font-size: 12px; }
        .student-table td { padding: 3px 0; }
        .student-table .label { font-weight: bold; width: 150px; }
        .gpa-summary { text-align: center; margin: 20px 0; font-size: 12px; }
        .school-header { background: #f0f0f0; padding: 5px; font-weight: bold; font-size: 12px; margin-top: 20px; }
        .semester-header { font-weight: bold; font-size: 12px; margin: 10px 0 5px 10px; }
        .course-table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px; }
        .course-table th, .course-table td { border: 1px solid black; padding: 3px; text-align: center; }
        .course-table th { background: white; font-weight: bold; }
        .course-table .course-title { text-align: left; }
        .semester-gpa { text-align: right; font-size: 12px; font-weight: bold; margin-bottom: 15px; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid black; font-size: 12px; }
        .signature-section { float: right; text-align: right; }
        .signature-line { border-bottom: 1px solid black; width: 200px; margin: 10px 0; }
        .comments-box { border: 2px solid black; padding: 16px; width: 350px; height: 180px; }
        .comments-header { background: #f0f0f0; border-bottom: 1px solid black; padding: 8px; margin: -16px -16px 12px -16px; font-weight: bold; }
        .stamp-area { margin-top: 32px; text-align: center; color: #999; border: 1px solid #ccc; border-radius: 4px; padding: 16px; }
        @media print {
            .watermark { position: fixed; }
        }
    </style>
</head>
<body>
    <div class="watermark">UNOFFICIAL TRANSCRIPT</div>
    
    ${htmlContent}
    
    <div class="footer">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 12px;">
            <!-- Left side - Comments/Legend Box -->
            <div style="border: 2px solid black; padding: 12px; width: 300px;">
                <div style="border-bottom: 1px solid black; padding-bottom: 8px; margin-bottom: 8px;">
                    <h4 style="font-weight: bold; margin: 0;">Comments</h4>
                </div>
                <div style="line-height: 1.4;">
                    <p style="font-weight: bold; margin: 4px 0;">UNOFFICIAL TRANSCRIPT</p>
                    <p style="margin: 4px 0;">CL-College Level</p>
                    <p style="margin: 4px 0;">IP- In Progress</p>
                    <p style="margin: 4px 0;">P- Pass</p>
                    <p style="margin: 4px 0;">F- Fail</p>
                </div>
            </div>
            
            <!-- Right side - Principal Signature -->
            <div style="text-align: center; width: 300px;">
                <div style="border-bottom: 1px solid black; width: 100%; margin-bottom: 8px; height: 1px;"></div>
                <p style="margin: 4px 0;">Principal Signature: Sangeetha Padman</p>
                <p style="margin: 4px 0;">Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
        </div>
    </div>
</body>
</html>`

    // Return PDF content as blob
    const encoder = new TextEncoder()
    const pdfBlob = encoder.encode(pdfContent)

    return new Response(pdfBlob, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${studentInfo.first_name}_${studentInfo.last_name}_Transcript.html"`,
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function generateTranscriptHTML(studentInfo: any, transcriptInfo: any, courses: any[], gpaData: any): string {
  // Calculate school-specific credits
  const transcriptSchoolCredits = courses
    .filter(course => course.school_name === transcriptInfo.school_name)
    .reduce((sum, course) => sum + course.credits, 0)

  const transferCredits = courses
    .filter(course => course.school_name !== transcriptInfo.school_name)
    .reduce((acc, course) => {
      if (!acc[course.school_name]) {
        acc[course.school_name] = 0
      }
      acc[course.school_name] += course.credits
      return acc
    }, {} as Record<string, number>)

  // Group courses by school and semester
  const groupedCourses = courses.reduce((acc, course) => {
    if (!course.school_name) return acc
    
    if (!acc[course.school_name]) {
      acc[course.school_name] = {}
    }
    
    const semesterKey = `${course.semester} ${course.year}`
    if (!acc[course.school_name][semesterKey]) {
      acc[course.school_name][semesterKey] = []
    }
    
    acc[course.school_name][semesterKey].push(course)
    return acc
  }, {} as Record<string, Record<string, any[]>>)

  // Function to mask SSN - show only last 4 digits
  const maskSSN = (ssn: string): string => {
    if (!ssn || ssn.length < 4) return ssn
    const lastFour = ssn.slice(-4)
    const masked = 'XXX-XX-' + lastFour
    return masked
  }

  return `
    <div class="header">
        <div class="title">${transcriptInfo.school_name.toUpperCase()} TRANSCRIPT</div>
        <div class="contact">
            <p>${transcriptInfo.school_address}</p>
            <p>Tel: ${transcriptInfo.school_phone} | Email: ${transcriptInfo.school_email} | CEEB Code: ${transcriptInfo.ceeb_code}</p>
        </div>
    </div>

    <div class="section-title">STUDENT INFORMATION</div>
    <div class="student-info">
        <table class="student-table">
            <tr>
                <td class="label">Student Name:</td>
                <td>${studentInfo.last_name}, ${studentInfo.first_name}</td>
            </tr>
            <tr>
                <td class="label">Address:</td>
                <td>${studentInfo.address}</td>
            </tr>
            <tr>
                <td class="label">Date of Birth:</td>
                <td>${studentInfo.date_of_birth ? new Date(studentInfo.date_of_birth).toLocaleDateString() : ''}</td>
            </tr>
            <tr>
                <td class="label">Guardian:</td>
                <td>${studentInfo.guardian_name}</td>
            </tr>
            <tr>
                <td class="label">Student Number:</td>
                <td>${studentInfo.student_number}</td>
            </tr>
            <tr>
                <td class="label">Gender:</td>
                <td>${studentInfo.gender}</td>
            </tr>
            ${studentInfo.ssn ? `
            <tr>
                <td class="label">SSN:</td>
                <td>${maskSSN(studentInfo.ssn)}</td>
            </tr>
            ` : ''}
        </table>
    </div>

    <div class="section-title">GPA SUMMARY</div>
    <div class="gpa-summary">
        <table style="width: 100%; border-collapse: collapse; border: 2px solid black;">
            <tr>
                <th style="border: 1px solid black; background: #f0f0f0; padding: 8px;">GPA Summary</th>
                <th style="border: 1px solid black; background: #f0f0f0; padding: 8px;">Total Credit Completed</th>
            </tr>
            <tr>
                <td style="border: 1px solid black; padding: 8px;">Cumulative GPA (Weighted): ${gpaData.cumulativeWeightedGPA.toFixed(3)}</td>
                <td style="border: 1px solid black; padding: 8px;">${transcriptSchoolCredits.toFixed(0)} ${transcriptInfo.school_name.toUpperCase()}</td>
            </tr>
            <tr>
                <th style="border: 1px solid black; background: #f0f0f0; padding: 8px;">Enrollment Summary</th>
                <th style="border: 1px solid black; background: #f0f0f0; padding: 8px;">Total Credit Transferred</th>
            </tr>
            <tr>
                <td style="border: 1px solid black; padding: 8px;">
                    <table style="width: 100%; font-size: 10px;">
                        <tr><th>Start/End Date</th><th>Grade</th><th>School</th></tr>
                        ${gpaData.semesterGPAs.map((semester: any) => `
                            <tr>
                                <td>${semester.year}</td>
                                <td>${semester.year - 2006}</td>
                                <td>${transcriptInfo.school_name}</td>
                            </tr>
                        `).join('')}
                    </table>
                </td>
                <td style="border: 1px solid black; padding: 8px;">
                    ${Object.entries(transferCredits).map(([school, credits]) => `
                        <div>${credits} ${school}</div>
                    `).join('')}
                    ${Object.keys(transferCredits).length === 0 ? '<div>No transfer credits</div>' : ''}
                </td>
            </tr>
        </table>
    </div>

    <div class="section-title">ACADEMIC RECORD</div>
    ${Object.entries(groupedCourses).map(([schoolName, semesters]) => `
        <div class="school-header">${schoolName}</div>
        ${Object.entries(semesters).map(([semesterKey, semesterCourses]) => {
          const semesterGPA = calculateSemesterGPA(semesterCourses)
          return `
            <div class="semester-header">${semesterKey}</div>
            <table class="course-table">
                <thead>
                    <tr>
                        <th style="width: 15%">Grade Level</th>
                        <th style="width: 15%">School Year</th>
                        <th style="width: 35%">Course Title</th>
                        <th style="width: 10%">H/AP</th>
                        <th style="width: 10%">Grade</th>
                        <th style="width: 15%">Credits</th>
                    </tr>
                </thead>
                <tbody>
                    ${semesterCourses.map(course => `
                        <tr>
                            <td>Grade ${course.year - 2006}</td>
                            <td>${course.year}</td>
                            <td class="course-title">${course.course_name}</td>
                            <td>${course.course_level === 'Honors' ? 'H' : course.course_level === 'AP' ? 'AP' : ''}</td>
                            <td><strong>${course.grade}</strong></td>
                            <td>${course.credits.toFixed(1)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="semester-gpa">Sem. GPA (Weighted): ${semesterGPA.toFixed(3)}</div>
          `
        }).join('')}
    `).join('')}
    
    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid black; display: flex; justify-content: space-between; align-items: center;">
        <!-- Comments Box -->
        <div class="comments-box">
            <div class="comments-header">Comments</div>
            <div style="line-height: 1.6;">
                <p style="font-weight: bold; margin: 8px 0;">UNOFFICIAL TRANSCRIPT</p>
                <p style="margin: 4px 0;">CL-College Level</p>
                <p style="margin: 4px 0;">IP- In Progress</p>
                <p style="margin: 4px 0;">P- Pass</p>
                <p style="margin: 4px 0;">F- Fail</p>
                <div class="stamp-area">
                    <p style="font-size: 10px;">School Stamp Area</p>
                </div>
            </div>
        </div>
        
        <!-- Principal Signature -->
        <div style="text-align: center; width: 250px;">
            <div style="border-bottom: 1px solid black; width: 100%; margin-bottom: 8px;"></div>
            <p style="margin: 4px 0;">Principal Signature: ${transcriptInfo.principal_name}</p>
            <p style="margin: 4px 0;">Date: ${transcriptInfo.signature_date}</p>
        </div>
    </div>
  `
}

function calculateSemesterGPA(courses: any[]): number {
  // Filter out courses with grades that should be excluded from GPA calculation
  const gradedCourses = courses.filter(course => course.grade !== 'P' && course.grade !== 'IP')
  
  if (gradedCourses.length === 0) return 0
  
  let totalWeightedPoints = 0
  let totalCredits = 0

  for (const course of gradedCourses) {
    const gradePoints = lookupGradePoints(course.grade, course.course_level)
    const weightedPoints = gradePoints * course.credits
    
    totalWeightedPoints += weightedPoints
    totalCredits += course.credits
  }

  if (totalCredits === 0) return 0
  
  return totalWeightedPoints / totalCredits
}

function lookupGradePoints(grade: string, courseLevel: string): number {
  const GRADE_POINT_SCALES: Record<string, Record<string, number>> = {
    'Regular': {
      'A+': 4.33, 'A': 4.00, 'A-': 3.67, 'B+': 3.33, 'B': 3.00, 'B-': 2.67,
      'C+': 2.33, 'C': 2.00, 'C-': 1.67, 'D+': 1.33, 'D': 1.00, 'D-': 0.67,
      'P': 0.00, 'IP': 0.00
    },
    'Honors': {
      'A+': 4.67, 'A': 4.33, 'A-': 4.00, 'B+': 3.67, 'B': 3.33, 'B-': 3.00,
      'C+': 2.67, 'C': 2.33, 'C-': 2.00, 'D+': 1.67, 'D': 1.33, 'D-': 1.00,
      'P': 0.00, 'IP': 0.00
    },
    'AP': {
      'A+': 5.33, 'A': 5.00, 'A-': 4.67, 'B+': 4.33, 'B': 4.00, 'B-': 3.67,
      'C+': 3.33, 'C': 3.00, 'C-': 2.67, 'D+': 2.33, 'D': 2.00, 'D-': 1.67,
      'P': 0.00, 'IP': 0.00
    },
    'College Level': {
      'A+': 5.33, 'A': 5.00, 'A-': 4.67, 'B+': 4.33, 'B': 4.00, 'B-': 3.67,
      'C+': 3.33, 'C': 3.00, 'C-': 2.67, 'D+': 2.33, 'D': 2.00, 'D-': 1.67,
      'P': 0.00, 'IP': 0.00
    }
  }

  return GRADE_POINT_SCALES[courseLevel]?.[grade] || 0
}