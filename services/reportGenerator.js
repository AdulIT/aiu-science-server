const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, AlignmentType, Italic } = require('docx');
const fs = require('fs');
const path = require('path');

async function generateSingleUserReport(userData, publications) {
  const types = {
    koknvo: [],
    scopus_wos: [],
    conference: [],
    articles: [],
    books: [],
    patents: []
  };

  publications.forEach(pub => {
    if (types[pub.publicationType]) {
      types[pub.publicationType].push(pub);
    } else {
      types.articles.push(pub);
    }
  });

  const totalPublications = publications.length;

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
          new Paragraph({
            text: `Количество публикации сотрудника за весь период: ${totalPublications}`,
            alignment: AlignmentType.LEFT,
          }),
          createMainTable(types)
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

function createMainTable(types) {
  const rows = [];
  let publicationIndex = 1;

  Object.entries(types).forEach(([type, pubs]) => {
    if (pubs.length > 0) {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: getTypeTitle(type), alignment: AlignmentType.CENTER, italics: true })],
              columnSpan: 6,
            }),
          ],
        })
      );

      pubs.forEach((pub, index) => {
        rows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph((publicationIndex++).toString())] }),
              new TableCell({ children: [new Paragraph(pub.title)] }),
              new TableCell({ children: [new Paragraph("Печатный")] }),
              new TableCell({ children: [new Paragraph(pub.output || 'N/A')] }),
              new TableCell({ children: [new Paragraph(pub.volume ? pub.volume.toString() : 'N/A')] }),
              new TableCell({
                children: [new Paragraph(
                  Array.isArray(pub.authors) ? (pub.authors.length > 0 ? pub.authors.join(', ') : 'N/A') : pub.authors || 'N/A'
                )]
              }),
            ],
          })
        );
      });
    }
  });

  return new Table({ rows });
}

function getTypeTitle(type) {
  const titles = {
    koknvo: "КОКНВО",
    scopus_wos: "Статьи в базе данных Scopus/WoS",
    conference: "Материалы конференций",
    articles: "Другие статьи",
    books: "Книги",
    patents: "Патенты",
  };
  return titles[type] || "Другие публикации";
}


async function generateAllPublicationsReport(publicationsByUser) {
    const totalPublications = Object.values(publicationsByUser).reduce((acc, user) => acc + user.publications.length, 0);
  
    const typeStats = {};
    const schoolStats = {};
  
    Object.values(publicationsByUser).forEach((userData) => {
      const { publications, user } = userData;
  
      publications.forEach((pub) => {
        if (!typeStats[pub.type]) typeStats[pub.type] = 0;
        typeStats[pub.type] += 1;
      });
  
      if (!schoolStats[user.higherSchool]) schoolStats[user.higherSchool] = {};
      publications.forEach((pub) => {
        if (!schoolStats[user.higherSchool][pub.type]) schoolStats[user.higherSchool][pub.type] = 0;
        schoolStats[user.higherSchool][pub.type] += 1;
      });
    });
  
    const typeStatsParagraphs = Object.entries(typeStats).map(([type, count]) => (
      new Paragraph({
        text: `${type}: ${count}`,
        alignment: AlignmentType.LEFT,
      })
    ));
  
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


module.exports = { generateSingleUserReport, generateAllPublicationsReport };