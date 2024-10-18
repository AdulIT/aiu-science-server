const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');

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
            ],
          }),
          ...publications.map((pub, index) => (
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph((index + 1).toString())] }),
                new TableCell({ children: [new Paragraph(pub.title)] }),
                new TableCell({ children: [new Paragraph("Печатный")] }),
                new TableCell({ children: [new Paragraph(pub.output)] }),
                new TableCell({ children: [new Paragraph(pub.volume ? pub.volume.toString() : "N/A")] }),
                new TableCell({
                  children: [new Paragraph(
                    Array.isArray(pub.authors) ? pub.authors.join(', ') : pub.authors // Handle if authors is a string or array
                  )]
                }),
              ],
            })
          )),
        ],
      },
    ],
  });

  const packer = new Packer();

  try {
    const buffer = await Packer.toBuffer(doc);

    // Ensure that the 'reports' directory exists
    const reportsDir = path.join(__dirname, 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir);
    }

    // File path for the report
    const filePath = path.join(reportsDir, `${userData.fullName}_work_list.docx`);
    fs.writeFileSync(filePath, buffer);

    return filePath; // Return the file path for download
  } catch (error) {
    console.error("Error while packing document: ", error);
    throw new Error("Could not generate the Word document.");
  }
}


async function generateAllPublicationsReport(publicationsByUser) {
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
          ],
        },
        ...Object.keys(publicationsByUser).map((userId, index) => {
          const user = publicationsByUser[userId].user;
          const publications = publicationsByUser[userId].publications;
  
          return {
            children: [
              new Paragraph({
                text: `${index + 1}. ${user.fullName} (${user.higherSchool})`,
                heading: HeadingLevel.HEADING_2,
              }),
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
                ],
              }),
              ...publications.map((pub, index) => (
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph((index + 1).toString())] }),
                    new TableCell({ children: [new Paragraph(pub.title)] }),
                    new TableCell({ children: [new Paragraph("Печатный")] }),
                    new TableCell({ children: [new Paragraph(pub.output)] }),
                    new TableCell({ children: [new Paragraph(pub.volume ? pub.volume.toString() : "N/A")] }),
                    new TableCell({ children: [new Paragraph(pub.authors.join(', '))] }),
                  ],
                })
              )),
            ],
          };
        }),
      ],
    });
  
    const packer = new Packer();
    const buffer = await packer.toBuffer(doc);
  
    const filePath = `./reports/all_publications_${new Date().getFullYear()}.docx`;
    fs.writeFileSync(filePath, buffer);
  
    return filePath;
  }

module.exports = { generateSingleUserReport, generateAllPublicationsReport };