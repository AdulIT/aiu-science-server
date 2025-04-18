const { Console } = require('console');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, AlignmentType, Italic } = require('docx');
const fs = require('fs');
const path = require('path');

async function generateSingleUserReport(userData, publications) {
  const groupedTypes = groupByType(publications || []); // Ensure publications is an array
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
          createMainTable(groupedTypes) // Generate single table with grouped types
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

function createMainTable(groupedTypes) {
  const rows = [];
  let publicationIndex = 1;
  console.log(1)


  Object.entries(groupedTypes).forEach(([type, pubs]) => {
    if (Array.isArray(pubs) && pubs.length > 0) { // Ensure pubs is a non-empty array
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

      pubs.forEach((pub) => {
        rows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph((publicationIndex++).toString())] }),
              new TableCell({ children: [new Paragraph(pub.title || 'N/A')] }),
              new TableCell({ children: [new Paragraph("Печатный")] }),
              new TableCell({ children: [new Paragraph(pub.output || 'N/A')] }),
              new TableCell({ children: [new Paragraph(pub.volume ? pub.volume.toString() : 'N/A')] }),
              new TableCell({
                children: [new Paragraph(
                  Array.isArray(pub.authors) ? pub.authors.join(', ') : (pub.authors || 'N/A')
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

async function generateAllPublicationsReport(publicationsByUser) {
  const totalPublications = Object.values(publicationsByUser).reduce((acc, user) => acc + user.publications.length, 0);

  const typeStats = {};
  const schoolStats = {};

  Object.values(publicationsByUser).forEach((userData) => {
    const { publications, user } = userData;

    publications.filter(pub => !!pub.publicationType).forEach((pub) => {
      if (!typeStats[pub.publicationType]) {
        typeStats[pub.publicationType] = 0
      };
      typeStats[pub.publicationType] += 1;
    });

    if (!schoolStats[user.higherSchool]) schoolStats[user.higherSchool] = {};
    publications.forEach((pub) => {
      if (!schoolStats[user.higherSchool][pub.publicationType]) schoolStats[user.higherSchool][pub.publicationType] = 0;
      schoolStats[user.higherSchool][pub.publicationType] += 1;
    });
  });
  
  const typeStatsParagraphs = Object.entries(typeStats).map(([type, count]) => 
    {
      return new Paragraph({
      text: `${getTypeTitle(type)}: ${count}`,
      alignment: AlignmentType.LEFT,
    })}
  );

  const schoolStatsParagraphs = [];
  Object.entries(schoolStats).forEach(([school, types]) => {
    schoolStatsParagraphs.push(new Paragraph({
      text: `Статистика для ${school}:`,
      alignment: AlignmentType.LEFT,
    }));

    Object.entries(types).forEach(([type, count]) => {
      schoolStatsParagraphs.push(new Paragraph({
        text: `- ${getTypeTitle(type)}: ${count}`,
        alignment: AlignmentType.LEFT,
      }));
    });
  });
// console.log(publicationsByUser)
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
          new Paragraph({
            text: "Список всех публикаций:",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300 },
          }),
          createMainTable(publicationsByUser),
        ],
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

function createMainTable(groupedTypes) {
    const rows = [];
    let publicationIndex = 1;
    console.log(2)
  
    // Check if there are any publications across all types

    const hasPublications = Object.values(groupedTypes).some(pubs => Array.isArray(pubs.publications) && pubs.publications.length > 0);
    if (!hasPublications) {
      // Add a fallback row if no publications exist
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Нет публикаций для отображения", alignment: AlignmentType.CENTER })],
              columnSpan: 6,
            }),
          ],
        })
      );
    } else {
      const groupByType = {}
      const allPubs = Object.entries(groupedTypes).map(([key, value]) => value.publications).flat()
      allPubs.forEach((pub) => {
        if (!groupByType[pub.publicationType]) {
          groupByType[pub.publicationType] = []
        };
        groupByType[pub.publicationType].push(pub)
      })
      rows.push(
        new TableRow({
      
          children: 
          ['№', 'Название трудов', 'Характер работы','Выходные данные','Объем п.л.','Фамилии авторов'].map((title) => 
          new TableCell({
              children: [new Paragraph({ text: title, alignment: AlignmentType.CENTER, italics: true })],
            }),
          )
        })
      )
      Object.entries(groupByType).sort(a => a[0] === undefined ? 1 : -1).forEach(([type, pubs]) => {
        if (Array.isArray(pubs) && pubs.length > 0) {

          rows.push(
            new TableRow({
          
              children: 
              [new TableCell({
                children: [new Paragraph({ text: getTypeTitle(type), alignment: AlignmentType.CENTER, italics: true })],
                columnSpan: 6
              })]
              
              
            })
          )
          
  
          pubs.forEach((pub) => {
            rows.push(
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph((publicationIndex++).toString())] }),
                  new TableCell({ children: [new Paragraph(pub?.title || 'N/A')] }),
                  new TableCell({ children: [new Paragraph("Печатный")] }),
                  new TableCell({ children: [new Paragraph(pub.output || 'N/A')] }),
                  new TableCell({ children: [new Paragraph(pub.volume ? pub.volume.toString() : 'N/A')] }),
                  new TableCell({
                    children: [new Paragraph(
                      Array.isArray(pub.authors) ? pub.authors.join(', ') : (pub.authors || 'N/A')
                    )]
                  }),
                ],
              })
            );
          });
        }
      });
    }
  
    return new Table({ rows });
  }

function groupByType(publications) {
    const grouped = {
      koknvo: [],
      scopus_wos: [],
      conference: [],
      articles: [],
      books: [],
      patents: [],
    };
  
    if (Array.isArray(publications)) {
      publications.forEach(pub => {
        if (grouped[pub.publicationType]) {
          grouped[pub.publicationType].push(pub);
        } else {
          grouped.articles.push(pub); // Default to 'articles' if no specific type is found
        }
      });
    }
  
    return grouped;
  }
  
  function getTypeTitle(type) {
    const titles = {
      koknvo: "Научные статьи в журналах КОКНВО",
      scopus_wos: "Публикации Scopus и Web of Science",
      conference: "Публикации в материалах конференций",
      articles: "Научные статьи в периодических изданиях",
      books: "Монографии, учебные пособия и другие книги",
      patents: "Патенты, авторские свидетельства и другие охранные документы",
    };
    return titles[type] || "Другие публикации";
  }
  
module.exports = { generateSingleUserReport, generateAllPublicationsReport };