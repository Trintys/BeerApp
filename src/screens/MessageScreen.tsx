// A simple full-screen message (loading, missing invite link, …).

interface Props {
  title: string
  text?: string
}

export function MessageScreen({ title, text }: Props) {
  return (
    <main className="screen screen--centered">
      <h1 className="title">{title}</h1>
      {text && <p className="muted">{text}</p>}
    </main>
  )
}
