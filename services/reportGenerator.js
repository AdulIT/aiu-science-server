const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');

// Генерация отчета для одного пользователя
async function generateSingleUserReport(userData, publications) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "Международный университет Астана",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Высшая школа: ${userData.higherSchool}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Список научных и научно-методических трудов старшего преподавателя ${userData.higherSchool} PhD`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `${userData.fullName}`,
            alignment: AlignmentType.CENTER,
          }),
        ],
      },
      {
        children: [
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("№")] }),
                  new TableCell({ children: [new Paragraph("Название трудов")] }),
                  new TableCell({ children: [new Paragraph("Характер работы")] }),
                  new TableCell({ children: [new Paragraph("Выходные данные")] }),
                  new TableCell({ children: [new Paragraph("Объем п.л.")] }),
                  new TableCell({ children: [new Paragraph("Авторы")] }),
                ],
              }),
              ...publications.map((pub, index) => (
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph((index + 1).toString())] }),
                    new TableCell({ children: [new Paragraph(pub.title)] }),
                    new TableCell({ children: [new Paragraph("Печатный")] }),
                    new TableCell({ children: [new Paragraph(pub.output || 'N/A')] }),
                    new TableCell({ children: [new Paragraph(pub.volume ? pub.volume.toString() : 'N/A')] }),
                    new TableCell({
                      children: [new Paragraph(
                        Array.isArray(pub.authors) ? (pub.authors.length > 0 ? pub.authors.join(', ') : 'N/A') : pub.authors || 'N/A'
                      )]
                    })
                  ],
                })
              )),
            ],
          }),
        ],
      },
    ],
  });

  try {
    const buffer = await Packer.toBuffer(doc);

    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }

    const filePath = path.join(reportsDir, `${userData.fullName}_work_list.docx`);
    fs.writeFileSync(filePath, buffer);

    return filePath;
  } catch (error) {
    console.error("Error while packing document: ", error);
    throw new Error("Could not generate the Word document.");
  }
}

async function generateAllPublicationsReport(publicationsByUser) {
    // Calculate overall statistics
    const totalPublications = Object.values(publicationsByUser).reduce((acc, user) => acc + user.publications.length, 0);
  
    const typeStats = {};
    const schoolStats = {};
  
    Object.values(publicationsByUser).forEach((userData) => {
      const { publications, user } = userData;
  
      // Accumulate statistics by type
      publications.forEach((pub) => {
        if (!typeStats[pub.type]) typeStats[pub.type] = 0;
        typeStats[pub.type] += 1;
      });
  
      // Accumulate statistics by higher school
      if (!schoolStats[user.higherSchool]) schoolStats[user.higherSchool] = {};
      publications.forEach((pub) => {
        if (!schoolStats[user.higherSchool][pub.type]) schoolStats[user.higherSchool][pub.type] = 0;
        schoolStats[user.higherSchool][pub.type] += 1;
      });
    });
  
    // Convert statistics to readable format
    const typeStatsParagraphs = Object.entries(typeStats).map(([type, count]) => (
      new Paragraph({
        text: `${type}: ${count}`,
        alignment: AlignmentType.LEFT,
      })
    ));
  
    // Handle school statistics
    const schoolStatsParagraphs = [];
    Object.entries(schoolStats).forEach(([school, types]) => {
      schoolStatsParagraphs.push(new Paragraph({
        text: `Статистика для ${school}:`,
        alignment: AlignmentType.LEFT,
      }));
      
      Object.entries(types).forEach(([type, count]) => {
        schoolStatsParagraphs.push(new Paragraph({
          text: `- ${type}: ${count}`,
          alignment: AlignmentType.LEFT,
        }));
      });
    });
  
    const doc = new Document({
      sections: [
        {
          properties: {}, // Keep document section properties empty unless necessary
          children: [
            // First page with statistics
            new Paragraph({
              text: "Международный университет Астана",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `Отчет по публикациям всех сотрудников за ${new Date().getFullYear()}`,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `Общее количество публикаций: ${totalPublications}`,
              alignment: AlignmentType.LEFT,
              spacing: { after: 300 },
            }),
            new Paragraph({
              text: "Статистика по типам публикаций:",
              heading: HeadingLevel.HEADING_2,
            }),
            ...typeStatsParagraphs,
            new Paragraph({
              text: "Статистика по высшим школам:",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300 },
            }),
            ...schoolStatsParagraphs,
          ],
        },
        {
          children: Object.keys(publicationsByUser).map((userId, index) => {
            const user = publicationsByUser[userId].user;
            const publications = publicationsByUser[userId].publications;
  
            const publicationRows = [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("№")] }),
                  new TableCell({ children: [new Paragraph("Название трудов")] }),
                  new TableCell({ children: [new Paragraph("Характер работы")] }),
                  new TableCell({ children: [new Paragraph("Выходные данные")] }),
                  new TableCell({ children: [new Paragraph("Объем п.л.")] }),
                  new TableCell({ children: [new Paragraph("Авторы")] }),
                ],
              }),
            ];
  
            publications.forEach((pub, index) => {
              publicationRows.push(
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph((index + 1).toString())] }),
                    new TableCell({ children: [new Paragraph(pub.title)] }),
                    new TableCell({ children: [new Paragraph("Печатный")] }),
                    new TableCell({ children: [new Paragraph(pub.output || 'N/A')] }),
                    new TableCell({ children: [new Paragraph(pub.volume ? pub.volume.toString() : "N/A")] }),
                    new TableCell({
                      children: [new Paragraph(
                        Array.isArray(pub.authors) ? pub.authors.join(', ') : (pub.authors || 'N/A')
                      )]
                    })
                  ],
                })
              );
            });
  
            return new Table({
              rows: publicationRows,
            });
          }),
        },
      ],
    });
  
    try {
      const reportsDir = path.join(__dirname, 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir);
      }
  
      const buffer = await Packer.toBuffer(doc);
      const filePath = path.join(reportsDir, `all_publications_${new Date().getFullYear()}.docx`);
      fs.writeFileSync(filePath, buffer);
  
      return filePath;
    } catch (error) {
      console.error("Error while packing document: ", error);
      throw new Error("Could not generate the Word document.");
    }
  }

// async function generateAllPublicationsReport(publicationsByUser) {
//     const doc = new Document({
//         sections: [
//             {
//                 children: [
//                     new Paragraph({
//                         text: "Международный университет Астана",
//                         heading: HeadingLevel.HEADING_1,
//                         alignment: AlignmentType.CENTER,
//                     }),
//                     new Paragraph({
//                         text: `Отчет по публикациям всех сотрудников за ${new Date().getFullYear()}`,
//                         alignment: AlignmentType.CENTER,
//                     }),
//                 ],
//             },
//             ...Object.keys(publicationsByUser).map((userId, index) => {
//                 const user = publicationsByUser[userId].user;
//                 const publications = publicationsByUser[userId].publications;

//                 const table = new Table({
//                     rows: [
//                         new TableRow({
//                             children: [
//                                 new TableCell({ children: [new Paragraph("№")] }),
//                                 new TableCell({ children: [new Paragraph("Название трудов")] }),
//                                 new TableCell({ children: [new Paragraph("Характер работы")] }),
//                                 new TableCell({ children: [new Paragraph("Выходные данные")] }),
//                                 new TableCell({ children: [new Paragraph("Объем п.л.")] }),
//                                 new TableCell({ children: [new Paragraph("Авторы")] }),
//                             ],
//                         }),
//                         ...publications.map((pub, idx) => (
//                             new TableRow({
//                                 children: [
//                                     new TableCell({ children: [new Paragraph((idx + 1).toString())] }),
//                                     new TableCell({ children: [new Paragraph(pub.title)] }),
//                                     new TableCell({ children: [new Paragraph("Печатный")] }),
//                                     new TableCell({ children: [new Paragraph(pub.output || 'N/A')] }),
//                                     new TableCell({ children: [new Paragraph(pub.volume ? pub.volume.toString() : "N/A")] }),
//                                     new TableCell({ children: [new Paragraph(Array.isArray(pub.authors) ? pub.authors.join(', ') : (pub.authors || 'N/A'))] }),
//                                 ],
//                             })
//                         )),
//                     ],
//                 });

//                 return {
//                     children: [
//                         new Paragraph({
//                             text: `${index + 1}. ${user.fullName} (${user.higherSchool})`,
//                             heading: HeadingLevel.HEADING_2,
//                         }),
//                         table,
//                     ],
//                 };
//             }),
//         ],
//     });

//     try {
//         const reportsDir = path.join(__dirname, 'reports');
//         if (!fs.existsSync(reportsDir)) {
//             fs.mkdirSync(reportsDir);
//         }

//         const buffer = await Packer.toBuffer(doc);

//         const filePath = path.join(reportsDir, `all_publications_${new Date().getFullYear()}.docx`);
//         fs.writeFileSync(filePath, buffer);

//         return filePath;
//     } catch (error) {
//         console.error("Error while packing document: ", error);
//         throw new Error("Could not generate the Word document.");
//     }
// }
module.exports = { generateSingleUserReport, generateAllPublicationsReport };