Attribute VB_Name = "Module_other"
Sub 他球団トレード()

Dim トレード記録row As Long
Sheets("FA選手").Calculate

    'トレード
    If Range("FA選手!DL151") = True Then
        '移籍作業
        Range("選手リスト!B1:G100").Replace what:=Range("FA選手!DJ154"), replacement:="", LookAt:=xlWhole, SearchOrder:=xlByRows, MatchCase:=False, SearchFormat:=False, ReplaceFormat:=False
        Range("選手リスト!B1:G100").Replace what:=Range("FA選手!DK154"), replacement:="", LookAt:=xlWhole, SearchOrder:=xlByRows, MatchCase:=False, SearchFormat:=False, ReplaceFormat:=False
        Range("選手リスト!B1:G100").Replace what:=Range("FA選手!DL154"), replacement:="", LookAt:=xlWhole, SearchOrder:=xlByRows, MatchCase:=False, SearchFormat:=False, ReplaceFormat:=False
        Range("選手リスト!B1:G100").Replace what:=Range("FA選手!DM154"), replacement:="", LookAt:=xlWhole, SearchOrder:=xlByRows, MatchCase:=False, SearchFormat:=False, ReplaceFormat:=False
        Range(Range("FA選手!DJ153").Value).Value = Range("FA選手!DJ154").Value
        Range(Range("FA選手!DK153").Value).Value = Range("FA選手!DK154").Value
        Range(Range("FA選手!DL153").Value).Value = Range("FA選手!DL154").Value
        Range(Range("FA選手!DM153").Value).Value = Range("FA選手!DM154").Value
        Range(Range("FA選手!DN153").Value).Value = Range("FA選手!DN154").Value
        Range(Range("FA選手!DO153").Value).Value = Range("FA選手!DO154").Value
        '記録作業
        トレード記録row = 158
        Do While Not Range("FA選手!DJ" & トレード記録row) = ""
            トレード記録row = トレード記録row + 1
        Loop
        Range("FA選手!DJ" & トレード記録row & ":DK" & トレード記録row + 3).Value = Range("FA選手!DM158:DN161").Value
    ElseIf Range("FA選手!DN151") = True And Range("data!G33") = False Then
        trade_neko.Show
    End If

Sheets("選手リスト").Calculate

End Sub



Sub オート進行()


Dim i As Integer

'采配オート
Range("data!E33").Value = "True"
Range("オーダー!BJ2:Bk29") = ""


For i = 1 To (Range("data!C34").Value * 2)
    If Not Range("data!F19").Value >= 140 Then 'シーズン終わってたらスキップも終わり
        Sleep 1
        game_skip.message.left = 6
        game_skip.message.Caption = "スキップ実行中...（あと" & 1 + Int(Range("data!C34").Value - i / 2) & "日）"
        game_skip.Repaint
        If Range("data!C5") = "午後" And Not Range("日程!C1") = 6 Then
            Call 試合実行ボタン
        End If
        Call 日程進行ボタン
    End If
Next

MsgBox "スキップが終了しました"

End Sub








