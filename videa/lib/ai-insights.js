exports.handler = async (event) => {
  try {
    const { videoId, title, description, labels, faces, transcript } = event

    // In a real implementation, we would use an AI service to generate insights
    // For this example, we'll generate mock insights

    // Generate a summary based on the transcript
    let summary = "This video appears to be about "

    // Look at the most common labels
    const labelCounts = {}
    labels.forEach((label) => {
      if (!labelCounts[label.name]) {
        labelCounts[label.name] = 0
      }
      labelCounts[label.name]++
    })

    const sortedLabels = Object.entries(labelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((entry) => entry[0])

    if (sortedLabels.includes("Person")) {
      summary += `people ${faces.length > 1 ? `(${faces.length} detected)` : ""} `
    }

    summary += `in a setting with ${sortedLabels.filter((label) => label !== "Person").join(", ")}.`

    if (transcript) {
      // In a real implementation, we would use AI to analyze the transcript
      summary +=
        " Based on the audio content, it discusses " +
        (transcript.length > 100 ? transcript.substring(0, 100) + "..." : transcript)
    }

    // Generate key moments
    const keyMoments = []

    // Use labels to identify potential key moments
    const labelsByTime = {}
    labels.forEach((label) => {
      const timeKey = Math.floor(label.timestamp / 1000)
      if (!labelsByTime[timeKey]) {
        labelsByTime[timeKey] = []
      }
      labelsByTime[timeKey].push(label.name)
    })

    // Find moments with multiple interesting labels
    Object.entries(labelsByTime)
      .sort((a, b) => Number.parseInt(a[0]) - Number.parseInt(b[0]))
      .forEach(([time, labelsAtTime]) => {
        if (labelsAtTime.length >= 3) {
          keyMoments.push({
            time: Number.parseInt(time),
            description: `Scene with ${labelsAtTime.slice(0, 3).join(", ")}`,
          })
        }
      })

    // Add face detection moments
    if (faces.length > 0) {
      faces.sort((a, b) => a.timestamp - b.timestamp)
      const firstFace = faces[0]
      keyMoments.push({
        time: Math.floor(firstFace.timestamp / 1000),
        description: "First person appears",
      })

      // Find moments with emotional expressions
      faces.forEach((face) => {
        if (face.emotions && face.emotions.length > 0) {
          const topEmotion = face.emotions.sort((a, b) => b.Confidence - a.Confidence)[0]
          if (topEmotion.Confidence > 90) {
            keyMoments.push({
              time: Math.floor(face.timestamp / 1000),
              description: `Person showing ${topEmotion.Type.toLowerCase()} expression`,
            })
          }
        }
      })
    }

    // Deduplicate and sort key moments
    const uniqueMoments = []
    const seenTimes = new Set()

    keyMoments
      .sort((a, b) => a.time - b.time)
      .forEach((moment) => {
        if (!seenTimes.has(moment.time)) {
          uniqueMoments.push(moment)
          seenTimes.add(moment.time)
        }
      })

    return {
      summary,
      keyMoments: uniqueMoments.slice(0, 5), // Limit to 5 key moments
    }
  } catch (error) {
    console.error("Error generating AI insights:", error)
    throw error
  }
}

